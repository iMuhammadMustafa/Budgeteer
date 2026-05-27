import dayjs from "dayjs";
import { Loader } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BucketingSection from "@/src/components/BucketingSection";
import ErrorLoader from "@/src/components/ErrorLoader";
import CategoryRowData from "@/src/components/Summary/CategoryRowData";
import PeriodSelector, { TimePeriod } from "@/src/components/Summary/PeriodSelector";
import SummaryFooter, { PeriodComparison } from "@/src/components/Summary/SummaryFooter";
import SummaryGroupData from "@/src/components/Summary/SummaryGroupData";
import SummaryLeftLegend, { TransactionData } from "@/src/components/Summary/SummaryLeftLegend";
import SummaryTableHeader, { PeriodData } from "@/src/components/Summary/SummaryTableHeader";
import { useStatsService } from "@/src/services/Stats.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { StatsMonthlyCategoriesTransactions } from "@/src/types/database/Tables.Types";

// Constants
const SCREEN_WIDTH = Dimensions.get("window").width;
const MIN_COLUMN_WIDTH = 180;

export default function SummaryIndex() {
  const {
    periods,
    timePeriod,
    setTimePeriod,
    refreshing,
    headerScrollRef,
    handleHorizontalScroll,
    comparisonData,
    isLoading,
    error,
    groupedData,
    columnWidth,
    onRefresh,
  } = useSummaryViewModel();

  if (isLoading && !refreshing) {
    return <Loader />;
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
    <SafeAreaView className="flex-1">
      <BucketingSection />

      <PeriodSelector timePeriod={timePeriod} setTimePeriod={setTimePeriod} onRefresh={onRefresh} />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={["#10b981"]} />
        }
        stickyHeaderIndices={comparisonData.length > 0 ? [0] : []}
      >
        <SummaryTableHeader periods={periods} columnWidth={columnWidth} headerScrollRef={headerScrollRef} />

        <View className="flex-row pb-10">
          <SummaryLeftLegend groupedData={groupedData} periods={periods} columnWidth={columnWidth} />

          <ScrollView
            horizontal
            onScroll={handleHorizontalScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={true}
            className="flex-1 bg-background"
          >
            <View>
              {Object.entries(groupedData).map(([groupName, categories]) => (
                <View key={groupName}>
                  <SummaryGroupData categories={categories} periods={periods} columnWidth={columnWidth} />
                  <CategoryRowData
                    groupName={groupName}
                    categories={categories}
                    periods={periods}
                    columnWidth={columnWidth}
                  />
                </View>
              ))}

              {/* Totals Row Data */}
              <SummaryFooter comparisonData={comparisonData} columnWidth={columnWidth} />
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useSummaryViewModel = () => {
  // State
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [refreshing, setRefreshing] = useState(false);
  const [focusedPeriod, setFocusedPeriod] = useState<number>(0); // Index of current period
  const { formatCurrency } = usePrimaryCurrency();

  // Refs for Scroll Sync
  const headerScrollRef = useRef<ScrollView>(null);
  const handleHorizontalScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  }, []);

  // Services
  const statsService = useStatsService();

  // Calculate periods based on time period
  const periods = useMemo((): PeriodData[] => {
    const now = dayjs();

    switch (timePeriod) {
      case "monthly":
        return Array.from({ length: 4 }, (_, i) => {
          const date = now.subtract(3 - i, "month");
          return {
            label: date.format("MMM YYYY"),
            start: date.startOf("month").toISOString(),
            end: date.endOf("month").toISOString(),
            isCurrent: i === 3,
          };
        });

      case "quarterly":
        return Array.from({ length: 4 }, (_, i) => {
          const date = now.subtract(3 - i, "quarter");
          const quarter = Math.floor(date.month() / 3) + 1;
          return {
            label: `Q${quarter} ${date.year()}`,
            start: date.startOf("quarter").toISOString(),
            end: date.endOf("quarter").toISOString(),
            isCurrent: i === 3,
          };
        });

      case "yearly":
        return Array.from({ length: 4 }, (_, i) => {
          const date = now.subtract(3 - i, "year");
          const isCurrentYear = i === 3;
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
  }, [timePeriod]);

  // Data fetching
  const queries = periods.map(period =>
    statsService.useGetStatsMonthlyCategoriesTransactionsRaw(period.start, period.end),
  );

  const isLoading = queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error;

  // Data transformation
  const comparisonData = useMemo((): PeriodComparison[] => {
    if (queries.some(q => q.isLoading || q.error)) return [];

    // Get all unique categories across all periods
    const allCategories = new Set<string>();
    queries.forEach(q => {
      if (Array.isArray(q.data)) {
        q.data.forEach((item: StatsMonthlyCategoriesTransactions) => {
          if (item.groupname && item.categoryname && item.type === "Expense") {
            allCategories.add(`${item.groupname}:${item.categoryname}`);
          }
        });
      }
    });

    return periods.map((period, periodIndex) => {
      const queryData = queries[periodIndex].data || [];

      const transactions: TransactionData[] = Array.from(allCategories).map(fullCategory => {
        const [groupName, categoryName] = fullCategory.split(":");
        // Filter all items for this group/category in the period
        const items = queryData.filter(
          (item: StatsMonthlyCategoriesTransactions) =>
            item.groupname === groupName && item.categoryname === categoryName && item.type === "Expense",
        );
        // Aggregate amounts and budgets
        const amount = items.reduce((sum, item) => sum + Math.abs(item.sum || 0), 0);
        const budget = items.reduce((sum, item) => sum + (item.categorybudgetamount || 0), 0);
        // Use icons/budgets from the first item (or null)
        const groupIcon = items[0]?.groupicon ?? null;
        const categoryIcon = items[0]?.categoryicon ?? null;
        const groupBudget = items[0]?.groupbudgetamount ?? null;
        return {
          group: groupName,
          category: categoryName,
          amount,
          budget,
          groupIcon,
          categoryIcon,
          groupBudget,
        };
      });

      const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        period,
        transactions,
        totalExpenses,
      };
    });
  }, [periods, queries]);

  // Group data by categories
  const groupedData = useMemo(() => {
    if (!comparisonData.length) return {};

    const grouped: Record<string, Record<string, TransactionData[]>> = {};

    comparisonData.forEach((periodData, periodIndex) => {
      periodData.transactions.forEach(transaction => {
        if (!grouped[transaction.group]) {
          grouped[transaction.group] = {};
        }
        if (!grouped[transaction.group][transaction.category]) {
          grouped[transaction.group][transaction.category] = [];
        }
        grouped[transaction.group][transaction.category][periodIndex] = transaction;
      });
    });

    return grouped;
  }, [comparisonData]);

  // Calculate responsive column widths
  const columnWidth = Math.max(MIN_COLUMN_WIDTH, (SCREEN_WIDTH - MIN_COLUMN_WIDTH - 180) / periods.length);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(queries.map(q => q.refetch()));
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queries]);

  return {
    periods,
    timePeriod,
    setTimePeriod,
    refreshing,
    focusedPeriod,
    formatCurrency,
    headerScrollRef,
    handleHorizontalScroll,
    comparisonData,
    isLoading,
    error,
    groupedData,
    columnWidth,
    onRefresh,
  };
};
