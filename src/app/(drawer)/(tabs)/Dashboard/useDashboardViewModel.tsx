import { getStatsDailyTransactionsHelper, useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { DoubleBarPoint, PieData } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export enum DashboardViewSelectionType {
  CALENDAR = "calendar",
  PIE = "pie",
  BAR = "bar",
}

export interface IDetailsViewProps {
  type: DashboardViewSelectionType;
  date?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
  pieType?: "category" | "group";
  itemId?: string;
  itemLabel?: string;
  month?: string;
}

export default function useDashboard(options?: { fetchTransactions?: boolean }) {
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const dateRanges = statsService.useGetDateRanges();
  const params = useLocalSearchParams() as Partial<IDetailsViewProps>;
  const fetchTransactions = options?.fetchTransactions ?? false;

  const initialMonthFromParams = useMemo(() => {
    if (params.startDate && params.endDate) {
      return {
        start: dayjs(params.startDate).utc().startOf("month").format("YYYY-MM-DD"),
        end: dayjs(params.endDate).utc().endOf("month").format("YYYY-MM-DD"),
      };
    }
    return dateRanges.currentMonth;
  }, [params, dateRanges]);

  const initialYearFromParams = useMemo(() => {
    if (params.startDate) {
      const base = dayjs(params.startDate).utc();
      return {
        start: base.startOf("year").toISOString(),
        end: base.endOf("year").toISOString(),
      };
    }
    return dateRanges.currentYear;
  }, [params, dateRanges]);

  // Period cursors (independent per-chart)
  const [weekBaseDate, setWeekBaseDate] = useState<string>(params.startDate ?? dayjs().toISOString());
  const [dailyMonthCursor, setDailyMonthCursor] = useState<{ start: string; end: string }>(initialMonthFromParams);
  const [piesMonthCursor, setPiesMonthCursor] = useState<{ start: string; end: string }>(initialMonthFromParams);
  const [yearCursor, setYearCursor] = useState<{ start: string; end: string }>(initialYearFromParams);

  // Fetch raw daily transactions for the calendar + weekly bar (month-bound)
  const { data: dailyTransactionsRaw = [], isLoading: isDailyLoading } = statsService.useGetStatsDailyTransactionsRaw(
    dailyMonthCursor.start,
    dailyMonthCursor.end,
  );

  // Fetch monthly categories/groups (month-bound)
  const { data: monthlyTransactionsGroupsAndCategories = { groups: [], categories: [] }, isLoading: isMonthlyLoading } =
    statsService.useGetStatsMonthlyCategoriesTransactions(piesMonthCursor.start, piesMonthCursor.end);

  // Fetch yearly charts (year-bound)
  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } =
    statsService.useGetStatsMonthlyTransactionsTypes(yearCursor.start, yearCursor.end);

  const { data: netWorthGrowth = [], isLoading: isNetWorthLoading } = statsService.useGetStatsNetWorthGrowth(
    yearCursor.start,
    yearCursor.end,
  );

  const filters = useMemo<TransactionFilters | undefined>(() => {
    if (!fetchTransactions) return undefined;

    const baseFilters: TransactionFilters = {};

    // Period window based on current view selection
    if (params.type === DashboardViewSelectionType.BAR) {
      baseFilters.startDate = dayjs(weekBaseDate).utc().startOf("week").toISOString();
      baseFilters.endDate = dayjs(weekBaseDate).utc().endOf("week").toISOString();
    } else if (params.type === DashboardViewSelectionType.PIE) {
      baseFilters.startDate = dayjs(piesMonthCursor.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(piesMonthCursor.end).utc().endOf("day").toISOString();
    } else if (params.type === DashboardViewSelectionType.CALENDAR) {
      baseFilters.startDate = dayjs(dailyMonthCursor.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(dailyMonthCursor.end).utc().endOf("day").toISOString();
    } else {
      if (params.startDate) baseFilters.startDate = params.startDate;
      if (params.endDate) baseFilters.endDate = params.endDate;
    }

    if (params.type === DashboardViewSelectionType.PIE && params.itemId && params.pieType) {
      if (params.pieType === "category") {
        baseFilters.categoryid = params.itemId;
      }
      if (params.pieType === "group") {
        baseFilters.groupid = params.itemId;
      }
    }

    return baseFilters;
  }, [fetchTransactions, params, weekBaseDate, piesMonthCursor, dailyMonthCursor]);

  const transactionsQuery = fetchTransactions && filters ? transactionService.useFindAllView(filters) : undefined;
  const filteredTransactions = fetchTransactions ? transactionsQuery?.data : undefined;
  const isFiltersLoading = fetchTransactions ? (transactionsQuery?.isLoading ?? false) : false;

  // Derived weekly bars and calendar data from raw daily
  const { weeklyTransactionTypesData, dailyTransactionTypesData } = useMemo(() => {
    const derived = getStatsDailyTransactionsHelper(dailyTransactionsRaw, true, weekBaseDate);
    const calendarDerived = getStatsDailyTransactionsHelper(dailyTransactionsRaw, false);
    return {
      weeklyTransactionTypesData: derived.barsData,
      dailyTransactionTypesData: calendarDerived.calendarData,
    };
  }, [dailyTransactionsRaw, weekBaseDate]);

  const dashboardData = useMemo(
    () => ({
      weeklyTransactionTypesData,
      dailyTransactionTypesData,
      monthlyCategories: monthlyTransactionsGroupsAndCategories.categories,
      monthlyGroups: monthlyTransactionsGroupsAndCategories.groups,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    }),
    [
      weeklyTransactionTypesData,
      dailyTransactionTypesData,
      monthlyTransactionsGroupsAndCategories,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    ],
  );

  const [isLocalLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading =
    isDailyLoading || isMonthlyLoading || isYearlyLoading || isNetWorthLoading || isFiltersLoading || isLocalLoading;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    statsService.useRefreshAllQueries();
    setTimeout(() => setRefreshing(false), 1000);
  }, [statsService]);

  const handleDayPress = useCallback((day: any, type: DashboardViewSelectionType) => {
    const dateString = dayjs(day.dateString).local().format("YYYY-MM-DD");
    const startOfDay = dayjs(day.dateString).utc().startOf("day").toISOString();
    const endOfDay = dayjs(day.dateString).utc().endOf("day").toISOString();

    router.push({
      pathname: "/Dashboard/Details",
      params: {
        type: type,
        date: dateString,
        label: dateString,
        startDate: startOfDay,
        endDate: endOfDay,
      },
    });
  }, []);

  const handlePiePress = useCallback(
    (item: PieData, type: "category" | "group") => {
      // Keep the currently selected monthly period when drilling into pies
      const startOfMonth = piesMonthCursor.start;
      const endOfMonth = piesMonthCursor.end;

      router.push({
        pathname: "/Dashboard/Details",
        params: {
          type: DashboardViewSelectionType.PIE,
          pieType: type,
          itemId: item.id,
          itemLabel: item.x,
          label: `${type === "category" ? "Category" : "Group"}: ${item.x}`,
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      });
    },
    [piesMonthCursor],
  );

  const handleBarPress = useCallback(
    (item: DoubleBarPoint) => {
      // Anchor monthly drilldowns to the currently selected year
      const baseYear = dayjs(yearCursor.start);
      const monthStart = baseYear.month(dayjs(item.x, "MMM").month()).utc().startOf("month");
      const startOfMonth = monthStart.toISOString();
      const endOfMonth = monthStart.endOf("month").toISOString();

      router.push({
        pathname: "/Dashboard/Details",
        params: {
          type: "bar",
          month: item.x,
          label: `Month: ${item.x}`,
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      });
    },
    [yearCursor],
  );

  const handleBackToOverview = useCallback(() => {
    router.replace("/Dashboard");
  }, []);

  const handleTransactionPress = useCallback((transaction: any) => {
    if (transaction.id) {
      router.push({
        pathname: "/AddTransaction",
        params: { id: transaction.id },
      });
    }
  }, []);

  const handleViewAllNavigation = useCallback(() => {
    const navigationParams: any = {};
    if (params.type === "calendar") {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
    } else if (params.type === "pie") {
      const key = params.pieType === "category" ? "categoryid" : "groupid";
      navigationParams[key] = params.itemId;
    } else if (params.type === "bar") {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
    }

    router.push({
      pathname: "/Transactions",
      params: navigationParams,
    });
  }, [params]);

  // Period labels
  const weekLabel = useMemo(() => {
    const start = dayjs(weekBaseDate).local().startOf("week");
    const end = dayjs(weekBaseDate).local().endOf("week");
    const sameMonth = start.month() === end.month();
    const startFmt = sameMonth ? start.format("MMM D") : start.format("MMM D");
    const endFmt = end.format("MMM D, YYYY");
    return `Week: ${startFmt} – ${endFmt}`;
  }, [weekBaseDate]);

  const monthLabel = useMemo(() => dayjs(piesMonthCursor.start).format("MMM YYYY"), [piesMonthCursor]);
  const calendarLabel = useMemo(() => dayjs(dailyMonthCursor.start).format("MMM YYYY"), [dailyMonthCursor]);
  const yearLabel = useMemo(() => yearCursor.start.substring(0, 4), [yearCursor]);

  // Period navigation handlers
  const onPrevWeek = useCallback(() => {
    const next = dayjs(weekBaseDate).subtract(1, "week");
    setWeekBaseDate(next.toISOString());
    // If crossing month, update daily month cursor (refetch only daily dataset)
    if (
      next.month() !== dayjs(dailyMonthCursor.start).month() ||
      next.year() !== dayjs(dailyMonthCursor.start).year()
    ) {
      setDailyMonthCursor({
        start: next.utc().startOf("month").format("YYYY-MM-DD"),
        end: next.utc().endOf("month").format("YYYY-MM-DD"),
      });
    }
  }, [weekBaseDate, dailyMonthCursor]);

  const onNextWeek = useCallback(() => {
    const next = dayjs(weekBaseDate).add(1, "week");
    setWeekBaseDate(next.toISOString());
    if (
      next.month() !== dayjs(dailyMonthCursor.start).month() ||
      next.year() !== dayjs(dailyMonthCursor.start).year()
    ) {
      setDailyMonthCursor({
        start: next.utc().startOf("month").format("YYYY-MM-DD"),
        end: next.utc().endOf("month").format("YYYY-MM-DD"),
      });
    }
  }, [weekBaseDate, dailyMonthCursor]);

  const onPrevMonth = useCallback(() => {
    const base = dayjs(piesMonthCursor.start).subtract(1, "month");
    setPiesMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [piesMonthCursor]);

  const onNextMonth = useCallback(() => {
    const base = dayjs(piesMonthCursor.start).add(1, "month");
    setPiesMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [piesMonthCursor]);

  const onPrevCalendarMonth = useCallback(() => {
    const base = dayjs(dailyMonthCursor.start).subtract(1, "month");
    setDailyMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [dailyMonthCursor]);

  const onNextCalendarMonth = useCallback(() => {
    const base = dayjs(dailyMonthCursor.start).add(1, "month");
    setDailyMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [dailyMonthCursor]);

  const onPrevYear = useCallback(() => {
    const base = dayjs(yearCursor.start).subtract(1, "year");
    setYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [yearCursor]);

  const onNextYear = useCallback(() => {
    const base = dayjs(yearCursor.start).add(1, "year");
    setYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [yearCursor]);

  const periodControls = {
    week: { label: weekLabel, prev: onPrevWeek, next: onNextWeek },
    month: { label: monthLabel, prev: onPrevMonth, next: onNextMonth },
    calendar: { label: calendarLabel, prev: onPrevCalendarMonth, next: onNextCalendarMonth, currentDate: dailyMonthCursor.start },
    year: { label: yearLabel, prev: onPrevYear, next: onNextYear },
  };

  return {
    ...dashboardData,
    isLoading,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    handleBackToOverview,
    filters,
    params,
    handleViewAllNavigation,
    periodControls,
  };
}
