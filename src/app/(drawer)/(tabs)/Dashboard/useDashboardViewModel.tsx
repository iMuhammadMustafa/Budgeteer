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

export default function useDashboard() {
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const dateRanges = statsService.useGetDateRanges();

  // Period cursors (independent per-chart)
  const [weekBaseDate, setWeekBaseDate] = useState<string>(dayjs().toISOString());
  const [dailyMonthCursor, setDailyMonthCursor] = useState<{ start: string; end: string }>(dateRanges.currentMonth);
  const [piesMonthCursor, setPiesMonthCursor] = useState<{ start: string; end: string }>(dateRanges.currentMonth);
  const [yearCursor, setYearCursor] = useState<{ start: string; end: string }>(dateRanges.currentYear);

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

  const params = useLocalSearchParams() as Partial<IDetailsViewProps>;
  const filters = useMemo<TransactionFilters>(() => {
    const baseFilters: TransactionFilters = {};
    if (params.startDate) baseFilters.startDate = params.startDate;
    if (params.endDate) baseFilters.endDate = params.endDate;

    if (params.type === DashboardViewSelectionType.PIE && params.itemId && params.pieType) {
      if (params.pieType === "category") {
        baseFilters.categoryid = params.itemId;
      }
      if (params.pieType === "group") {
        baseFilters.groupid = params.itemId;
      }
    }

    return baseFilters;
  }, [params]);
  const { data: filteredTransactions, isLoading: isFiltersLoading } = transactionService.useFindAllView(filters);

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

  const handlePiePress = useCallback((item: PieData, type: "category" | "group") => {
    const startOfMonth = dayjs().utc().startOf("month").toISOString();
    const endOfMonth = dayjs().utc().endOf("month").toISOString();

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
  }, []);

  const handleBarPress = useCallback((item: DoubleBarPoint) => {
    const startOfMonth = dayjs(item.x).utc().startOf("month").toISOString();
    const endOfMonth = dayjs(item.x).endOf("month").toISOString();
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
  }, []);

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
  const yearLabel = useMemo(() => dayjs(yearCursor.start).format("YYYY"), [yearCursor]);

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
    calendar: { label: calendarLabel, prev: onPrevCalendarMonth, next: onNextCalendarMonth },
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
