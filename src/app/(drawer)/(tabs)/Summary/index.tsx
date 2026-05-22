import Button from "@/src/components/elements/Button";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BucketingSection from "@/src/components/BucketingSection";
import MyIcon from "@/src/components/elements/MyIcon";
import { useStatsService } from "@/src/services/Stats.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { StatsMonthlyCategoriesTransactions } from "@/src/types/database/Tables.Types";

dayjs.extend(quarterOfYear);

// Types
type TimePeriod = "monthly" | "quarterly" | "yearly";

interface PeriodData {
  label: string;
  start: string;
  end: string;
  isCurrent: boolean;
}

interface TransactionData {
  group: string;
  category: string;
  amount: number;
  budget: number;
  groupIcon?: string | null;
  categoryIcon?: string | null;
  groupBudget?: number | null;
}

interface PeriodComparison {
  period: PeriodData;
  transactions: TransactionData[];
  totalExpenses: number;
}

// Constants
const SCREEN_WIDTH = Dimensions.get("window").width;
const MIN_COLUMN_WIDTH = 120;
const CATEGORY_COLUMN_WIDTH = 160;

// Utility functions
const getGradientColors = (usage: number): [string, string, string] => {
  //   if (usage <= 0.5) return ["#10b981", "#f59e0b"];
  //   if (usage <= 0.8) return ["#f59e0b", "#ef4444"];
  //   return ["#ef4444", "#dc2626"];

  return ["#10b981", "#f59e0b", "#ef4444"];
};

export default function SummaryIndex() {
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
  const columnWidth = Math.max(MIN_COLUMN_WIDTH, (SCREEN_WIDTH - CATEGORY_COLUMN_WIDTH - 32) / periods.length);

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

  // Render loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-base text-foreground">Loading expense data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-5">
          <Text className="text-lg font-bold text-status-danger mb-2">Failed to load expense data</Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </Text>
          <Button
            variant="primary"
            size="md"
            hapticFeedback="error"
            onPress={onRefresh}
            label="Try Again"
            testID="btn-summary-retry"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <BucketingSection />

      {/* Time Period Selector */}
      <View className="flex-row items-center gap-2 bg-surface px-4 py-2.5 border-b border-border-default/40 z-10" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 }}>
        <View className="flex-row flex-1 bg-surface-elevated/80 rounded-xl p-1 border border-border-default/30">
          {(["monthly", "quarterly", "yearly"] as TimePeriod[]).map(period => (
            <Button
              key={period}
              variant={timePeriod === period ? "primary" : "ghost"}
              size="sm"
              hapticFeedback="selection"
              onPress={() => setTimePeriod(period)}
              className={`flex-1 py-1.5 px-3 rounded-lg items-center ${timePeriod === period ? "shadow-sm" : ""}`}
              testID={`btn-period-${period}`}
            >
              <Text
                className={`${timePeriod === period ? "text-primary-foreground font-bold" : "text-muted-foreground font-medium"} capitalize text-xs`}
              >
                {period}
              </Text>
            </Button>
          ))}
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={onRefresh}
          testID="btn-summary-refresh"
          className="bg-surface-elevated rounded-full w-8 h-8 items-center justify-center border border-border-default/40"
          iconColor="#10b981"
          rightIcon="RefreshCcw"
          iconSize={20}
        />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={["#10b981"]} />
        }
        stickyHeaderIndices={comparisonData.length > 0 ? [0] : []}
      >
        {/* Sticky Header Row (Index 0) */}
        {comparisonData.length > 0 && (
          <View className="flex-row bg-surface-elevated border-b border-border-default shadow-sm z-20" style={{ elevation: 3 }}>
            <View style={{ width: CATEGORY_COLUMN_WIDTH }} className="py-3 px-4 border-r border-border-default/40 justify-center items-center">
              <Text className="font-bold text-xs text-foreground tracking-wide uppercase opacity-80 text-center">Category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={headerScrollRef} scrollEnabled={false} className="flex-1">
              {periods.map((period, index) => (
                <View key={index} style={{ width: columnWidth }} className="px-2 py-3 justify-center">
                  <Text className="font-bold text-xs text-foreground text-center" numberOfLines={2}>
                    {period.label}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Scrollable Body Row (Index 1) */}
        {comparisonData.length > 0 ? (
          <View className="flex-row pb-10">
            {/* STICKY LEFT COLUMN */}
            <View style={{ width: CATEGORY_COLUMN_WIDTH, elevation: 2, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.05, shadowRadius: 3 }} className="bg-surface border-r border-border-default/40 z-10">
              {Object.entries(groupedData).map(([groupName, categories]) => (
                <View key={groupName}>
                  {/* Group Header */}
                  <View className="bg-surface-elevated/40 py-3 border-b border-border-default/50 px-4 justify-center" style={{ height: 58 }}>
                    <View className="flex-row items-center h-full">
                      <View className="w-8 h-8 items-center justify-center mr-2 rounded-full bg-background border border-border-default/30">
                        {Object.values(categories)[0]?.[0]?.groupIcon && (
                          <MyIcon
                            name={Object.values(categories)[0][0].groupIcon!}
                            size={16}
                            className="text-foreground"
                          />
                        )}
                      </View>
                      <Text className="font-bold text-[15px] text-foreground flex-1 tracking-tight">{groupName}</Text>
                    </View>
                  </View>

                  {/* Category Rows */}
                  {Object.entries(categories).map(([categoryName, categoryTransactions], categoryIndex) => {
                    const hasBudget = periods.some((_, periodIndex) => {
                      const transaction = categoryTransactions[periodIndex];
                      const amount = transaction?.amount || 0;
                      const budget = transaction?.budget || 0;
                      return budget > 0 && amount > 0;
                    });
                    const rowHeight = hasBudget ? 54 : 54;

                    return (
                      <View
                        key={`${groupName}-${categoryName}`}
                        className={`${categoryIndex % 2 === 0 ? "bg-surface" : "bg-background"} py-2 border-b border-border-default/30 px-4 justify-center`}
                        style={{ height: rowHeight }}
                      >
                        <View className="flex-row items-center pl-4 h-full">
                          <View className="w-6 h-6 items-center justify-center mr-2 opacity-70">
                            {categoryTransactions[0]?.categoryIcon && (
                              <MyIcon
                                name={categoryTransactions[0].categoryIcon!}
                                size={14}
                                className="text-muted-foreground"
                              />
                            )}
                          </View>
                          <Text className="text-[13px] text-muted-foreground flex-1 font-medium" numberOfLines={2}>
                            {categoryName}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Totals Row */}
              <View className="bg-primary/5 py-4 border-t border-border-default px-4 justify-center" style={{ height: 64 }}>
                <Text className="font-bold text-[15px] text-foreground tracking-tight uppercase">Total</Text>
              </View>
            </View>

            {/* HORIZONTALLY SCROLLABLE DATA */}
            <ScrollView horizontal onScroll={handleHorizontalScroll} scrollEventThrottle={16} showsHorizontalScrollIndicator={true} className="flex-1 bg-background">
              <View>
                {Object.entries(groupedData).map(([groupName, categories]) => (
                  <View key={groupName}>
                    {/* Group Header Data */}
                    <View className="flex-row bg-surface-elevated/40 py-3 border-b border-border-default/50" style={{ height: 58 }}>
                      {periods.map((period, periodIndex) => {
                        const groupTotal = Object.values(categories).reduce(
                          (sum, categoryTransactions) => sum + (categoryTransactions[periodIndex]?.amount || 0),
                          0,
                        );
                        const previousTotal =
                          periodIndex > 0
                            ? Object.values(categories).reduce(
                              (sum, categoryTransactions) => sum + (categoryTransactions[periodIndex - 1]?.amount || 0),
                              0,
                            )
                            : null;

                        const hasIncrease = previousTotal !== null && groupTotal > previousTotal;
                        const hasDecrease = previousTotal !== null && groupTotal < previousTotal;

                        return (
                          <View
                            key={periodIndex}
                            style={{ width: columnWidth }}
                            className="px-2 items-center justify-center h-full"
                          >
                            <View className="flex-row items-center justify-center bg-background/50 py-1.5 px-3 rounded-lg" style={{ gap: 4 }}>
                              <Text
                                className={`font-semibold text-sm text-center ${hasIncrease
                                  ? "text-status-danger"
                                  : hasDecrease
                                    ? "text-status-success"
                                    : "text-foreground"
                                  }`}
                              >
                                {formatCurrency(groupTotal)}
                              </Text>
                              {hasIncrease && <ArrowUp size={14} color="#ef4444" />}
                              {hasDecrease && <ArrowDown size={14} color="#10b981" />}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Category Rows Data */}
                    {Object.entries(categories).map(([categoryName, categoryTransactions], categoryIndex) => {
                      const hasBudget = periods.some((_, periodIndex) => {
                        const transaction = categoryTransactions[periodIndex];
                        const amount = transaction?.amount || 0;
                        const budget = transaction?.budget || 0;
                        return budget > 0 && amount > 0;
                      });
                      const rowHeight = hasBudget ? 54 : 54;

                      return (
                        <View
                          key={`${groupName}-${categoryName}`}
                          className={`flex-row ${categoryIndex % 2 === 0 ? "bg-surface" : "bg-background"} py-2 border-b border-border-default/30`}
                          style={{ height: rowHeight }}
                        >
                          {periods.map((period, periodIndex) => {
                            const transaction = categoryTransactions[periodIndex];
                            const amount = transaction?.amount || 0;
                            const budget = transaction?.budget || 0;
                            const budgetUsage = budget > 0 ? Math.min(amount / budget, 1) : 0;

                            const previousAmount =
                              periodIndex > 0 ? categoryTransactions[periodIndex - 1]?.amount || 0 : null;

                            const hasIncrease = previousAmount !== null && amount > previousAmount;
                            const hasDecrease = previousAmount !== null && amount < previousAmount;

                            return (
                              <View key={periodIndex} style={{ width: columnWidth }} className="px-2 justify-center">
                                <View className="items-center justify-center h-full">
                                  <View className="flex-row items-center justify-center mb-1.5" style={{ gap: 4 }}>
                                    <Text
                                      className={`text-[13px] text-center ${hasIncrease
                                        ? "text-status-danger font-medium"
                                        : hasDecrease
                                          ? "text-status-success font-medium"
                                          : "text-foreground font-medium"
                                        }`}
                                    >
                                      {formatCurrency(amount)}
                                    </Text>
                                    {hasBudget ? (
                                      <Text className="text-[11px] text-muted-foreground/70 font-medium">
                                        / {formatCurrency(budget)}
                                      </Text>
                                    ) : null}
                                    {hasIncrease && <ArrowUp size={12} color="#ef4444" />}
                                    {hasDecrease && <ArrowDown size={12} color="#10b981" />}
                                  </View>

                                  {/* Budget Progress Bar */}
                                  {budget > 0 && amount > 0 && (
                                    <View className="w-full flex items-center">
                                      <View
                                        style={{ width: columnWidth * 0.6 }}
                                        className="h-1.5 bg-muted rounded-full overflow-hidden relative"
                                      >
                                        <LinearGradient
                                          colors={getGradientColors(budgetUsage)}
                                          start={{ x: 0, y: 0 }}
                                          end={{ x: 1, y: 0 }}
                                          style={{
                                            width: `${budgetUsage * 100}%`,
                                            height: "100%",
                                          }}
                                        />
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))}

                {/* Totals Row Data */}
                <View className="flex-row bg-primary/5 py-4 border-t border-border-default" style={{ height: 64 }}>
                  {comparisonData.map((periodData, periodIndex) => {
                    const previousTotal = periodIndex > 0 ? comparisonData[periodIndex - 1].totalExpenses : null;
                    const hasIncrease = previousTotal !== null && periodData.totalExpenses > previousTotal;
                    const hasDecrease = previousTotal !== null && periodData.totalExpenses < previousTotal;

                    return (
                      <View
                        key={periodIndex}
                        style={{ width: columnWidth }}
                        className="px-2 items-center justify-center h-full"
                      >
                        <View className="flex-row items-center justify-center bg-background py-2 px-4 rounded-xl border border-border-default/50" style={{ gap: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
                          <Text className="font-bold text-[15px] text-foreground text-center tracking-tight">
                            {formatCurrency(periodData.totalExpenses)}
                          </Text>
                          {hasIncrease && <ArrowUp size={14} color="#ef4444" />}
                          {hasDecrease && <ArrowDown size={14} color="#10b981" />}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center p-10 bg-surface/50 mt-8 mx-5 rounded-3xl border border-border-default/50">
            <View className="w-16 h-16 bg-background rounded-full items-center justify-center mb-4 border border-border-default/30 shadow-sm">
              <ActivityIndicator color="#10b981" />
            </View>
            <Text className="text-[15px] text-muted-foreground text-center font-medium">No transaction data available for comparison</Text>
            <Text className="text-[13px] text-muted-foreground/60 text-center mt-2">Try selecting a different time period</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
