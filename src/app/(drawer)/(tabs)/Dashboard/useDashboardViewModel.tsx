import { useCallback, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";

import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { DoubleBarPoint, PieData } from "@/src/types/components/Charts.types";
import { getStatsDailyTransactionsHelper, useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";

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

type PeriodRange = { start: string; end: string };

/** Month cursor boundaries — `YYYY-MM-DD` strings (what the month-bound stat queries expect). */
const monthRange = (base: dayjs.Dayjs): PeriodRange => ({
  start: base.utc().startOf("month").format("YYYY-MM-DD"),
  end: base.utc().endOf("month").format("YYYY-MM-DD"),
});

/** Year cursor boundaries — ISO strings (what the year-bound stat queries expect). */
const yearRange = (base: dayjs.Dayjs): PeriodRange => ({
  start: base.utc().startOf("year").toISOString(),
  end: base.utc().endOf("year").toISOString(),
});

/**
 * One independent period cursor for a chart: the current `range`, its display `label`, and
 * `prev`/`next` steppers. Replaces five near-identical cursor+label+prev+next quadruples in this
 * view model — behaviour is unchanged (same boundary formats, same labels, same stepping math).
 */
function usePeriodCursor(initial: PeriodRange, unit: "month" | "year") {
  const [range, setRange] = useState<PeriodRange>(initial);
  const rangeOf = unit === "month" ? monthRange : yearRange;
  const prev = useCallback(() => setRange(r => rangeOf(dayjs(r.start).subtract(1, unit))), [rangeOf, unit]);
  const next = useCallback(() => setRange(r => rangeOf(dayjs(r.start).add(1, unit))), [rangeOf, unit]);
  const label = useMemo(
    () => (unit === "month" ? dayjs(range.start).format("MMM YYYY") : range.start.substring(0, 4)),
    [range.start, unit],
  );
  return { range, label, prev, next, setRange };
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

  // Period cursors (independent per-chart). The week cursor is bespoke (it also nudges the daily
  // month cursor when a week crosses a month); the rest are uniform month/year cursors.
  const [weekBaseDate, setWeekBaseDate] = useState<string>(params.startDate ?? dayjs().toISOString());
  const daily = usePeriodCursor(initialMonthFromParams, "month"); // calendar + weekly-bar month bound
  const categories = usePeriodCursor(initialMonthFromParams, "month");
  const groups = usePeriodCursor(initialMonthFromParams, "month");
  const earnings = usePeriodCursor(initialYearFromParams, "year");
  const netWorth = usePeriodCursor(initialYearFromParams, "year");

  // Fetch raw daily transactions for the calendar + weekly bar (month-bound).
  // `isFetching` (vs `isLoading`) stays true on a period change too — the queries keep the previous
  // period's data as placeholder, so we surface a subtle per-chart skeleton instead of blanking.
  const {
    data: dailyTransactionsRaw = [],
    isLoading: isDailyLoading,
    isFetching: isDailyFetching,
  } = statsService.useGetStatsDailyTransactionsRaw(daily.range.start, daily.range.end);

  // Fetch monthly categories (month-bound)
  const {
    data: monthlyCategoriesData = { categories: [], groups: [] },
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
  } = statsService.useGetStatsMonthlyCategoriesTransactions(categories.range.start, categories.range.end);

  // Fetch monthly groups (month-bound)
  const {
    data: monthlyGroupsData = { categories: [], groups: [] },
    isLoading: isGroupsLoading,
    isFetching: isGroupsFetching,
  } = statsService.useGetStatsMonthlyCategoriesTransactions(groups.range.start, groups.range.end);

  // Fetch yearly charts (year-bound)
  const {
    data: yearlyTransactionsTypes = [],
    isLoading: isYearlyLoading,
    isFetching: isYearlyFetching,
  } = statsService.useGetStatsMonthlyTransactionsTypes(earnings.range.start, earnings.range.end);

  const {
    data: netWorthGrowth = [],
    isLoading: isNetWorthLoading,
    isFetching: isNetWorthFetching,
  } = statsService.useGetStatsNetWorthGrowth(netWorth.range.start, netWorth.range.end);

  const filters = useMemo<TransactionFilters | undefined>(() => {
    if (!fetchTransactions) return undefined;

    const baseFilters: TransactionFilters = {};

    // Period window based on current view selection
    if (params.type === DashboardViewSelectionType.BAR) {
      baseFilters.startDate = dayjs(weekBaseDate).utc().startOf("week").toISOString();
      baseFilters.endDate = dayjs(weekBaseDate).utc().endOf("week").toISOString();
    } else if (params.type === DashboardViewSelectionType.PIE) {
      const cursor = params.pieType === "category" ? categories.range : groups.range;
      baseFilters.startDate = dayjs(cursor.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(cursor.end).utc().endOf("day").toISOString();
    } else if (params.type === DashboardViewSelectionType.CALENDAR) {
      baseFilters.startDate = dayjs(daily.range.start).utc().startOf("day").toISOString();
      baseFilters.endDate = dayjs(daily.range.end).utc().endOf("day").toISOString();
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
  }, [fetchTransactions, params, weekBaseDate, categories.range, groups.range, daily.range]);

  const transactionsQuery = fetchTransactions && filters ? transactionService.useFindAllView(filters) : undefined;
  const filteredTransactions = fetchTransactions ? transactionsQuery?.data : undefined;
  const isFiltersLoading = fetchTransactions ? (transactionsQuery?.isLoading ?? false) : false;

  // Fetch a generous batch for the dashboard overview card - it's height-matched to the
  // Week's Expenses chart card and scrolls internally, so it can afford more than it usually shows.
  const recentTransactionsQuery = transactionService.useFindAllView({ limit: 5 });
  const recentTransactions = recentTransactionsQuery.data;
  const isRecentLoading = recentTransactionsQuery.isLoading;

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
      recentTransactions,
    }),
    [
      weeklyTransactionTypesData,
      dailyTransactionTypesData,
      monthlyCategoriesData,
      monthlyGroupsData,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
      recentTransactions,
    ],
  );

  const [isLocalLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading =
    isDailyLoading ||
    isCategoriesLoading ||
    isGroupsLoading ||
    isYearlyLoading ||
    isNetWorthLoading ||
    isFiltersLoading ||
    isRecentLoading ||
    isLocalLoading;

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
      const cursor = type === "category" ? categories.range : groups.range;
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
    [categories.range, groups.range],
  );

  const handleBarPress = useCallback(
    (item: DoubleBarPoint, barKey?: "barOne" | "barTwo") => {
      const baseYear = dayjs(earnings.range.start);
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(
        item.x,
      );

      const monthStart = baseYear
        .month(monthIndex >= 0 ? monthIndex : 0)
        .utc()
        .startOf("month");
      const startOfMonth = monthStart.toISOString();
      const endOfMonth = monthStart.endOf("month").toISOString();

      const transactionTypeStr =
        barKey === "barOne" ? item.barOne.label : barKey === "barTwo" ? item.barTwo.label : undefined;

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
    [earnings.range],
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
    } else if (
      params.type === DashboardViewSelectionType.BAR ||
      params.type === DashboardViewSelectionType.DOUBLE_BAR
    ) {
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

  // Week period label (bespoke — spans two dates rather than a single month/year).
  const weekLabel = useMemo(() => {
    const start = dayjs(weekBaseDate).local().startOf("week");
    const end = dayjs(weekBaseDate).local().endOf("week");
    const startFmt = start.format("MMM D");
    const endFmt = end.format("MMM D, YYYY");
    return `Week: ${startFmt} – ${endFmt}`;
  }, [weekBaseDate]);

  // Week navigation is bespoke: it moves the week cursor and, when the new week falls in a
  // different month, nudges the daily month cursor so the calendar/heatmap follows along.
  const stepWeek = useCallback(
    (delta: 1 | -1) => {
      const next = dayjs(weekBaseDate).add(delta, "week");
      setWeekBaseDate(next.toISOString());
      const cur = dayjs(daily.range.start);
      if (next.month() !== cur.month() || next.year() !== cur.year()) {
        daily.setRange(monthRange(next));
      }
    },
    [weekBaseDate, daily],
  );
  const onPrevWeek = useCallback(() => stepWeek(-1), [stepWeek]);
  const onNextWeek = useCallback(() => stepWeek(1), [stepWeek]);

  const periodControls = {
    week: { label: weekLabel, prev: onPrevWeek, next: onNextWeek, loading: isDailyFetching },
    categoriesMonth: {
      label: categories.label,
      prev: categories.prev,
      next: categories.next,
      loading: isCategoriesFetching,
    },
    groupsMonth: {
      label: groups.label,
      prev: groups.prev,
      next: groups.next,
      loading: isGroupsFetching,
    },
    calendar: {
      label: daily.label,
      prev: daily.prev,
      next: daily.next,
      currentDate: daily.range.start,
      loading: isDailyFetching,
    },
    earningsYear: { label: earnings.label, prev: earnings.prev, next: earnings.next, loading: isYearlyFetching },
    netWorthYear: { label: netWorth.label, prev: netWorth.prev, next: netWorth.next, loading: isNetWorthFetching },
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
