import { useCallback, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";

import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { DoubleBarPoint, PieData } from "@/src/types/components/Charts.types";
import {
  DashboardViewSelectionType,
  IDetailsViewProps,
  PeriodControl,
  PeriodRange,
} from "@/src/types/pages/dashboard/DashboardConfig.Types";
import { useAccountService } from "@/src/services/Accounts.Service";
import { getStatsDailyTransactionsHelper, useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";

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
  const accountService = useAccountService();
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const dateRanges = statsService.useGetDateRanges();
  const params = useLocalSearchParams() as Partial<IDetailsViewProps>;
  const fetchTransactions = options?.fetchTransactions ?? false;

  const { data: totalBalanceData } = accountService.useGetTotalAccountsBalance();
  const { data: accounts } = accountService.useFindAllWithCategory();

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
  // month cursor when a week crosses a month); the rest are uniform month/year cursors. The
  // calendar summary intentionally owns a separate month cursor/query from the calendar itself.
  const [weekBaseDate, setWeekBaseDate] = useState<string>(params.startDate ?? dayjs().toISOString());
  const daily = usePeriodCursor(initialMonthFromParams, "month"); // calendar + weekly-bar month bound
  const calendarSummaryPeriod = usePeriodCursor(initialMonthFromParams, "month");
  const categories = usePeriodCursor(initialMonthFromParams, "month");
  const groups = usePeriodCursor(initialMonthFromParams, "month");
  const earnings = usePeriodCursor(initialYearFromParams, "year");
  const netWorth = usePeriodCursor(initialYearFromParams, "year");

  // Tap-to-select highlight state per drillable chart. Kept here (not inside the chart components)
  // so the ChartCard "Details" link can carry the currently-selected item into the drill-down page.
  // Each setter toggles: re-selecting the same item clears it.
  const [selection, setSelection] = useState<{
    weekDate: string | null;
    category: PieData | null;
    group: PieData | null;
    earningsMonth: string | null;
  }>({ weekDate: null, category: null, group: null, earningsMonth: null });

  const selectWeekDay = useCallback(
    (date: string) => setSelection(s => ({ ...s, weekDate: s.weekDate === date ? null : date })),
    [],
  );
  const selectPieSlice = useCallback(
    (type: "category" | "group", item: PieData | null) =>
      setSelection(s => ({ ...s, [type]: item && s[type]?.id === item.id ? null : item })),
    [],
  );
  const selectEarningsMonth = useCallback(
    (month: string) => setSelection(s => ({ ...s, earningsMonth: s.earningsMonth === month ? null : month })),
    [],
  );

  // Fetch raw daily transactions for the calendar + weekly bar (month-bound).
  // `isFetching` (vs `isLoading`) stays true on a period change too — the queries keep the previous
  // period's data as placeholder, so we surface a subtle per-chart skeleton instead of blanking.
  const {
    data: dailyTransactionsRaw = [],
    isLoading: isDailyLoading,
    isFetching: isDailyFetching,
  } = statsService.useGetStatsDailyTransactionsRaw(daily.range.start, daily.range.end);

  // The summary has its own query so paging it never changes the heatmap or the weekly chart's
  // month-bound source data. TanStack Query can still reuse the cache while both show one month.
  const {
    data: calendarSummaryTransactionsRaw = [],
    isLoading: isCalendarSummaryLoading,
    isFetching: isCalendarSummaryFetching,
  } = statsService.useGetStatsDailyTransactionsRaw(
    calendarSummaryPeriod.range.start,
    calendarSummaryPeriod.range.end,
  );

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

  // Month-at-a-glance summary for the panel beside the calendar on wide screens. It is derived
  // from the summary's independent raw query so its period control cannot move other charts.
  const calendarSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const spendByDay = new Map<string, number>();
    const activeDays = new Set<string>();
    for (const r of calendarSummaryTransactionsRaw as {
      date: string | null;
      sum: number | null;
      type: string | null;
    }[]) {
      if (!r.date) continue;
      const key = dayjs(r.date).format("YYYY-MM-DD");
      activeDays.add(key);
      const amt = Math.abs(r.sum ?? 0);
      if (r.type === "Income") income += amt;
      else if (r.type === "Expense") {
        expense += amt;
        spendByDay.set(key, (spendByDay.get(key) ?? 0) + amt);
      }
    }
    const topDays = [...spendByDay.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([date, amount]) => ({ date, amount }));
    return { income, expense, net: income - expense, activeDays: activeDays.size, topDays };
  }, [calendarSummaryTransactionsRaw]);

  const [isLocalLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading =
    isDailyLoading ||
    isCalendarSummaryLoading ||
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
    // The whole period around this day: the week for a bar-day, the month for a calendar-day.
    const d = dayjs(day.dateString).utc();
    const periodUnit = type === DashboardViewSelectionType.BAR ? "week" : "month";

    router.push({
      pathname: "/Dashboard/Details",
      params: {
        type: type,
        date: dateString,
        label: dateString,
        startDate: startOfDay,
        endDate: endOfDay,
        periodStart: d.startOf(periodUnit).toISOString(),
        periodEnd: d.endOf(periodUnit).toISOString(),
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
          // Period = the whole month (the toggle's "All · <month>" scope).
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
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
          // Period = the whole year (the toggle's "All · <year>" scope).
          periodStart: earnings.range.start,
          periodEnd: earnings.range.end,
        },
      });
    },
    [earnings.range],
  );

  // The "Details" link on a chart card: drill into the whole period. If a slice/day/month is
  // tap-selected, carry it as the focused item so the details page opens on it (and its chart
  // highlights it); otherwise the page opens on its "All · <period>" scope.
  const handleChartDetails = useCallback(
    (opts: {
      type: DashboardViewSelectionType;
      pieType?: "category" | "group";
      periodStart: string;
      periodEnd: string;
      label: string;
      /** Focused item, when a chart element is tap-selected. */
      date?: string;
      startDate?: string;
      endDate?: string;
      itemId?: string;
      itemLabel?: string;
      month?: string;
    }) => {
      router.push({
        pathname: "/Dashboard/Details",
        params: {
          type: opts.type,
          pieType: opts.pieType,
          label: opts.label,
          // Focused-item window falls back to the whole period when nothing is selected.
          startDate: opts.startDate ?? opts.periodStart,
          endDate: opts.endDate ?? opts.periodEnd,
          periodStart: opts.periodStart,
          periodEnd: opts.periodEnd,
          date: opts.date,
          itemId: opts.itemId,
          itemLabel: opts.itemLabel,
          month: opts.month,
        },
      });
    },
    [],
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

  const weekPeriod = useMemo(
    () => ({
      start: dayjs(weekBaseDate).utc().startOf("week").toISOString(),
      end: dayjs(weekBaseDate).utc().endOf("week").toISOString(),
    }),
    [weekBaseDate],
  );

  const periodControls: {
    week: PeriodControl;
    categoriesMonth: PeriodControl;
    groupsMonth: PeriodControl;
    netWorthYear: PeriodControl;
    earningsYear: PeriodControl;
    calendar: PeriodControl;
    calendarSummary: PeriodControl;
  } = {
    week: {
      chartCardPeriod: {
        label: weekLabel,
        onPrev: onPrevWeek,
        onNext: onNextWeek,
      },
      loading: isDailyFetching,
      onDetails: () =>
        handleChartDetails({
          type: DashboardViewSelectionType.BAR,
          periodStart: weekPeriod.start,
          periodEnd: weekPeriod.end,
          label: weekLabel,
          ...(selection.weekDate
            ? {
                date: selection.weekDate,
                startDate: dayjs(selection.weekDate).utc().startOf("day").toISOString(),
                endDate: dayjs(selection.weekDate).utc().endOf("day").toISOString(),
              }
            : {}),
        }),
    },
    categoriesMonth: {
      chartCardPeriod: {
        label: categories.label,
        onPrev: categories.prev,
        onNext: categories.next,
      },
      loading: isCategoriesFetching,
      onDetails: () =>
        handleChartDetails({
          type: DashboardViewSelectionType.PIE,
          pieType: "category",
          periodStart: categories.range.start,
          periodEnd: categories.range.end,
          label: `Categories · ${categories.label}`,
          ...(selection.category ? { itemId: selection.category.id, itemLabel: selection.category.x } : {}),
        }),
    },
    groupsMonth: {
      chartCardPeriod: {
        label: groups.label,
        onPrev: groups.prev,
        onNext: groups.next,
      },
      loading: isGroupsFetching,
      onDetails: () =>
        handleChartDetails({
          type: DashboardViewSelectionType.PIE,
          pieType: "group",
          periodStart: groups.range.start,
          periodEnd: groups.range.end,
          label: `Groups · ${groups.label}`,
          ...(selection.group ? { itemId: selection.group.id, itemLabel: selection.group.x } : {}),
        }),
    },
    calendar: {
      chartCardPeriod: {
        label: daily.label,
        onPrev: daily.prev,
        onNext: daily.next,
      },
      currentDate: daily.range.start,
      loading: isDailyFetching,
    },
    calendarSummary: {
      chartCardPeriod: {
        label: calendarSummaryPeriod.label,
        onPrev: calendarSummaryPeriod.prev,
        onNext: calendarSummaryPeriod.next,
      },
      loading: isCalendarSummaryFetching,
    },
    earningsYear: {
      chartCardPeriod: {
        label: earnings.label,
        onPrev: earnings.prev,
        onNext: earnings.next,
      },
      loading: isYearlyFetching,
      onDetails: () =>
        handleChartDetails({
          type: DashboardViewSelectionType.DOUBLE_BAR,
          periodStart: earnings.range.start,
          periodEnd: earnings.range.end,
          label: `Net Earnings · ${earnings.label}`,
          ...(selection.earningsMonth ? { month: selection.earningsMonth } : {}),
        }),
    },
    netWorthYear: {
      chartCardPeriod: {
        label: netWorth.label,
        onPrev: netWorth.prev,
        onNext: netWorth.next,
      },
      loading: isNetWorthFetching,
    },
  };

  const { income, spending, sparkline } = useMemo(() => {
    const thisMonth = (yearlyTransactionsTypes ?? []).find(d => d.x === dayjs().format("MMM"));
    return {
      income: Math.abs(thisMonth?.barOne.value ?? 0),
      spending: Math.abs(thisMonth?.barTwo.value ?? 0),
      sparkline: (netWorthGrowth ?? []).map(p => p.y).slice(-9),
    };
  }, [yearlyTransactionsTypes, netWorthGrowth]);

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
    calendarSummary,
    selection,
    selectWeekDay,
    selectPieSlice,
    selectEarningsMonth,
    income,
    spending,
    sparkline,
    totalbalance: totalBalanceData?.totalbalance ?? 0,
    accountsCount: accounts?.length ?? 0,
  };
}
