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
  DOUBLE_BAR = "double_bar",
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
  transactionType?: string;
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
  const [categoriesMonthCursor, setCategoriesMonthCursor] = useState<{ start: string; end: string }>(initialMonthFromParams);
  const [groupsMonthCursor, setGroupsMonthCursor] = useState<{ start: string; end: string }>(initialMonthFromParams);
  const [earningsYearCursor, setEarningsYearCursor] = useState<{ start: string; end: string }>(initialYearFromParams);
  const [netWorthYearCursor, setNetWorthYearCursor] = useState<{ start: string; end: string }>(initialYearFromParams);

  // Fetch raw daily transactions for the calendar + weekly bar (month-bound)
  const { data: dailyTransactionsRaw = [], isLoading: isDailyLoading } = statsService.useGetStatsDailyTransactionsRaw(
    dailyMonthCursor.start,
    dailyMonthCursor.end,
  );

  // Fetch monthly categories (month-bound)
  const { data: monthlyCategoriesData = { categories: [], groups: [] }, isLoading: isCategoriesLoading } =
    statsService.useGetStatsMonthlyCategoriesTransactions(categoriesMonthCursor.start, categoriesMonthCursor.end);

  // Fetch monthly groups (month-bound)
  const { data: monthlyGroupsData = { categories: [], groups: [] }, isLoading: isGroupsLoading } =
    statsService.useGetStatsMonthlyCategoriesTransactions(groupsMonthCursor.start, groupsMonthCursor.end);

  // Fetch yearly charts (year-bound)
  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } =
    statsService.useGetStatsMonthlyTransactionsTypes(earningsYearCursor.start, earningsYearCursor.end);

  const { data: netWorthGrowth = [], isLoading: isNetWorthLoading } = statsService.useGetStatsNetWorthGrowth(
    netWorthYearCursor.start,
    netWorthYearCursor.end,
  );

  const filters = useMemo<TransactionFilters | undefined>(() => {
    if (!fetchTransactions) return undefined;

    const baseFilters: TransactionFilters = {};

    // Period window based on current view selection
    if (params.type === DashboardViewSelectionType.BAR) {
      baseFilters.startDate = dayjs(weekBaseDate).utc().startOf("week").toISOString();
      baseFilters.endDate = dayjs(weekBaseDate).utc().endOf("week").toISOString();
    } else if (params.type === DashboardViewSelectionType.PIE) {
      const cursor = params.pieType === "category" ? categoriesMonthCursor : groupsMonthCursor;
      baseFilters.startDate = dayjs(cursor.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(cursor.end).utc().endOf("day").toISOString();
    } else if (params.type === DashboardViewSelectionType.CALENDAR) {
      baseFilters.startDate = dayjs(dailyMonthCursor.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(dailyMonthCursor.end).utc().endOf("day").toISOString();
    } else if (params.type === DashboardViewSelectionType.DOUBLE_BAR) {
      baseFilters.startDate = params.startDate;
      baseFilters.endDate = params.endDate;
      if (params.transactionType) {
         baseFilters.type = params.transactionType as any;
      }
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
  }, [fetchTransactions, params, weekBaseDate, categoriesMonthCursor, groupsMonthCursor, dailyMonthCursor]);

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
      monthlyCategories: monthlyCategoriesData.categories,
      monthlyGroups: monthlyGroupsData.groups,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    }),
    [
      weeklyTransactionTypesData,
      dailyTransactionTypesData,
      monthlyCategoriesData,
      monthlyGroupsData,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    ],
  );

  const [isLocalLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading =
    isDailyLoading || isCategoriesLoading || isGroupsLoading || isYearlyLoading || isNetWorthLoading || isFiltersLoading || isLocalLoading;

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
      const cursor = type === "category" ? categoriesMonthCursor : groupsMonthCursor;
      const startOfMonth = cursor.start;
      const endOfMonth = cursor.end;

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
    [categoriesMonthCursor, groupsMonthCursor],
  );

  const handleBarPress = useCallback(
    (item: DoubleBarPoint, barKey?: "barOne" | "barTwo") => {
      const baseYear = dayjs(earningsYearCursor.start);
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(item.x);

      const monthStart = baseYear.month(monthIndex >= 0 ? monthIndex : 0).utc().startOf("month");
      const startOfMonth = monthStart.toISOString();
      const endOfMonth = monthStart.endOf("month").toISOString();
      
      const transactionTypeStr = barKey === "barOne" ? item.barOne.label : barKey === "barTwo" ? item.barTwo.label : undefined;

      router.push({
        pathname: "/Dashboard/Details",
        params: {
          type: DashboardViewSelectionType.DOUBLE_BAR,
          month: item.x,
          label: transactionTypeStr ? `${item.x} ${transactionTypeStr}` : `Month: ${item.x}`,
          startDate: startOfMonth,
          endDate: endOfMonth,
          transactionType: transactionTypeStr,
        },
      });
    },
    [earningsYearCursor],
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
    if (params.type === DashboardViewSelectionType.CALENDAR) {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
    } else if (params.type === DashboardViewSelectionType.PIE) {
      const key = params.pieType === "category" ? "categoryid" : "groupid";
      navigationParams[key] = params.itemId;
    } else if (params.type === DashboardViewSelectionType.BAR || params.type === DashboardViewSelectionType.DOUBLE_BAR) {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
      if (params.transactionType) {
        navigationParams.type = params.transactionType;
      }
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

  const categoriesMonthLabel = useMemo(() => dayjs(categoriesMonthCursor.start).format("MMM YYYY"), [categoriesMonthCursor]);
  const groupsMonthLabel = useMemo(() => dayjs(groupsMonthCursor.start).format("MMM YYYY"), [groupsMonthCursor]);
  const calendarLabel = useMemo(() => dayjs(dailyMonthCursor.start).format("MMM YYYY"), [dailyMonthCursor]);
  const earningsYearLabel = useMemo(() => earningsYearCursor.start.substring(0, 4), [earningsYearCursor]);
  const netWorthYearLabel = useMemo(() => netWorthYearCursor.start.substring(0, 4), [netWorthYearCursor]);

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

  const onPrevCategoriesMonth = useCallback(() => {
    const base = dayjs(categoriesMonthCursor.start).subtract(1, "month");
    setCategoriesMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [categoriesMonthCursor]);

  const onNextCategoriesMonth = useCallback(() => {
    const base = dayjs(categoriesMonthCursor.start).add(1, "month");
    setCategoriesMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [categoriesMonthCursor]);

  const onPrevGroupsMonth = useCallback(() => {
    const base = dayjs(groupsMonthCursor.start).subtract(1, "month");
    setGroupsMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [groupsMonthCursor]);

  const onNextGroupsMonth = useCallback(() => {
    const base = dayjs(groupsMonthCursor.start).add(1, "month");
    setGroupsMonthCursor({
      start: base.utc().startOf("month").format("YYYY-MM-DD"),
      end: base.utc().endOf("month").format("YYYY-MM-DD"),
    });
  }, [groupsMonthCursor]);

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

  const onPrevEarningsYear = useCallback(() => {
    const base = dayjs(earningsYearCursor.start).subtract(1, "year");
    setEarningsYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [earningsYearCursor]);

  const onNextEarningsYear = useCallback(() => {
    const base = dayjs(earningsYearCursor.start).add(1, "year");
    setEarningsYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [earningsYearCursor]);

  const onPrevNetWorthYear = useCallback(() => {
    const base = dayjs(netWorthYearCursor.start).subtract(1, "year");
    setNetWorthYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [netWorthYearCursor]);

  const onNextNetWorthYear = useCallback(() => {
    const base = dayjs(netWorthYearCursor.start).add(1, "year");
    setNetWorthYearCursor({
      start: base.utc().startOf("year").toISOString(),
      end: base.utc().endOf("year").toISOString(),
    });
  }, [netWorthYearCursor]);

  const periodControls = {
    week: { label: weekLabel, prev: onPrevWeek, next: onNextWeek },
    categoriesMonth: { label: categoriesMonthLabel, prev: onPrevCategoriesMonth, next: onNextCategoriesMonth },
    groupsMonth: { label: groupsMonthLabel, prev: onPrevGroupsMonth, next: onNextGroupsMonth },
    calendar: { label: calendarLabel, prev: onPrevCalendarMonth, next: onNextCalendarMonth, currentDate: dailyMonthCursor.start },
    earningsYear: { label: earningsYearLabel, prev: onPrevEarningsYear, next: onNextEarningsYear },
    netWorthYear: { label: netWorthYearLabel, prev: onPrevNetWorthYear, next: onNextNetWorthYear },
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
