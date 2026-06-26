import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BucketingSection from "@/src/components/BucketingSection";
import ErrorLoader from "@/src/components/ErrorLoader";
import {
  EmptyState,
  Loader,
  SummaryGrid,
  SummaryPeriodBar,
  type PeriodMeta,
  type SummaryRow,
  type TimePeriod,
} from "@/src/components/ui";
import { useStatsService } from "@/src/services/Stats.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { StatsMonthlyCategoriesTransactions } from "@/src/types/database/Tables.Types";

// Hooks must run in a stable order, so we always fetch MAX_PERIODS and show the
// most recent `periodCount` of them (user-configurable, default 3).
const MAX_PERIODS = 6;
const DEFAULT_PERIODS = 3;

export default function SummaryIndex() {
  const {
    periods,
    timePeriod,
    setTimePeriod,
    periodCount,
    setPeriodCount,
    refreshing,
    isLoading,
    error,
    rows,
    totals,
    formatCurrency,
    onRefresh,
  } = useSummaryViewModel();

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg">
        <Loader label="Loading summary…" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <ErrorLoader
        message={error instanceof Error ? error.message : "Unknown error occurred"}
        onRefresh={onRefresh}
        title="Failed to load Summary data"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <BucketingSection />

      <SummaryPeriodBar
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        periodCount={periodCount}
        onPeriodCountChange={setPeriodCount}
        onRefresh={onRefresh}
        minCount={2}
        maxCount={MAX_PERIODS}
      />

      {rows.length === 0 ? (
        <EmptyState
          iconName="ChartNoAxesColumn"
          title="No expense data"
          subtitle="Once you add expense transactions, your period-by-period breakdown shows here."
        />
      ) : (
        <View className="flex-1">
          <SummaryGrid
            periods={periods}
            rows={rows}
            totals={totals}
            formatCurrency={formatCurrency}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const buildPeriods = (timePeriod: TimePeriod, count: number): PeriodMeta[] => {
  const now = dayjs();
  switch (timePeriod) {
    case "monthly":
      return Array.from({ length: count }, (_, i) => {
        const date = now.subtract(count - 1 - i, "month");
        return {
          label: date.format("MMM YYYY"),
          start: date.startOf("month").toISOString(),
          end: date.endOf("month").toISOString(),
          isCurrent: i === count - 1,
        };
      });
    case "quarterly":
      return Array.from({ length: count }, (_, i) => {
        const date = now.subtract(count - 1 - i, "quarter");
        const quarter = Math.floor(date.month() / 3) + 1;
        return {
          label: `Q${quarter} ${date.year()}`,
          start: date.startOf("quarter").toISOString(),
          end: date.endOf("quarter").toISOString(),
          isCurrent: i === count - 1,
        };
      });
    case "yearly":
      return Array.from({ length: count }, (_, i) => {
        const date = now.subtract(count - 1 - i, "year");
        const isCurrentYear = i === count - 1;
        return {
          label: isCurrentYear ? `${date.year()} YTD` : `${date.year()}`,
          start: date.startOf("year").toISOString(),
          end: isCurrentYear ? now.toISOString() : date.endOf("year").toISOString(),
          isCurrent: isCurrentYear,
        };
      });
    default:
      return [];
  }
};

const useSummaryViewModel = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [periodCount, setPeriodCount] = useState(DEFAULT_PERIODS);
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = usePrimaryCurrency();
  const statsService = useStatsService();

  // Always compute + fetch the maximum so the hook count never changes.
  const allPeriods = useMemo(() => buildPeriods(timePeriod, MAX_PERIODS), [timePeriod]);
  const queries = allPeriods.map(period =>
    statsService.useGetStatsMonthlyCategoriesTransactionsRaw(period.start, period.end),
  );

  const visibleFrom = MAX_PERIODS - periodCount;
  const periods = allPeriods.slice(visibleFrom);
  const visibleQueries = queries.slice(visibleFrom);

  const isLoading = visibleQueries.some(q => q.isLoading);
  const error = visibleQueries.find(q => q.error)?.error;

  // `queries` is a fresh array each render (one hook per period), so memoizing on
  // it would recompute every render anyway — compute inline instead.
  const { rows, totals } = computeRows(visibleQueries, periods);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(queries.map(q => q.refetch()));
    } catch (e) {
      console.error("Failed to refresh summary:", e);
    } finally {
      setRefreshing(false);
    }
  }, [queries]);

  return {
    periods,
    timePeriod,
    setTimePeriod,
    periodCount,
    setPeriodCount,
    refreshing,
    isLoading,
    error,
    rows,
    totals,
    formatCurrency,
    onRefresh,
  };
};

type StatsQuery = ReturnType<ReturnType<typeof useStatsService>["useGetStatsMonthlyCategoriesTransactionsRaw"]>;

function computeRows(visibleQueries: StatsQuery[], periods: PeriodMeta[]): { rows: SummaryRow[]; totals: number[] } {
  if (visibleQueries.some(q => q.isLoading || q.error)) {
    return { rows: [], totals: [] };
  }
  const datasets = visibleQueries.map(q => (Array.isArray(q.data) ? q.data : []));

  // Stable category ordering across periods (Expense only).
  const order: string[] = [];
  const seen = new Set<string>();
  datasets.forEach(data =>
    data.forEach((item: StatsMonthlyCategoriesTransactions) => {
      if (item.groupname && item.categoryname && item.type === "Expense") {
        const key = `${item.groupname}:${item.categoryname}`;
        if (!seen.has(key)) {
          seen.add(key);
          order.push(key);
        }
      }
    }),
  );

  const rows: SummaryRow[] = order.map(key => {
    const [group, category] = key.split(":");
    const amounts: number[] = [];
    const budgets: number[] = [];
    let groupIcon: string | null = null;
    let categoryIcon: string | null = null;
    let groupBudget: number | null = null;

    datasets.forEach(data => {
      const items = data.filter(
        (item: StatsMonthlyCategoriesTransactions) =>
          item.groupname === group && item.categoryname === category && item.type === "Expense",
      );
      amounts.push(items.reduce((sum, item) => sum + Math.abs(item.sum || 0), 0));
      budgets.push(items.reduce((sum, item) => sum + (item.categorybudgetamount || 0), 0));
      if (items[0]) {
        groupIcon = groupIcon ?? items[0].groupicon ?? null;
        categoryIcon = categoryIcon ?? items[0].categoryicon ?? null;
        groupBudget = groupBudget ?? items[0].groupbudgetamount ?? null;
      }
    });

    return { group, category, groupIcon, categoryIcon, groupBudget, amounts, budgets };
  });

  const totals = periods.map((_, i) => rows.reduce((sum, row) => sum + (row.amounts[i] ?? 0), 0));
  return { rows, totals };
}
