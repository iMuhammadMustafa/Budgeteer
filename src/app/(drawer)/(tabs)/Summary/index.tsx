import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, ArrowUp, RefreshCcw } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

dayjs.extend(quarterOfYear);

import MyIcon from "@/src/components/elements/MyIcon";
import { useStatsService } from "@/src/services/Stats.Service";
import { StatsMonthlyCategoriesTransactions } from "@/src/types/database/Tables.Types";

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

const formatCurrency = (amount: number): string => {
  return `$${Math.abs(amount).toFixed(2)}`;
};

export default function SummaryIndex() {
  // State
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [refreshing, setRefreshing] = useState(false);
  const [focusedPeriod, setFocusedPeriod] = useState<number>(0); // Index of current period

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
        <StatusBar backgroundColor="#1e293b" barStyle="light-content" />
        <View className="flex-1 justify-center items-center px-5">
          <Text className="text-lg font-bold text-red-500 mb-2">Failed to load expense data</Text>
          <Text className="text-sm text-muted-foreground text-center mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </Text>
          <Pressable onPress={onRefresh} className="bg-success-500 py-3 px-6 rounded-lg">
            <Text className="text-primary-foreground font-semibold">Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar backgroundColor="#1e293b" barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-card border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Expense Summary</Text>
        <Pressable onPress={onRefresh} className="p-2">
          <RefreshCcw size={24} color="#10b981" />
        </Pressable>
      </View>

      {/* Time Period Selector */}
      <View className="bg-card p-4 border-b border-border">
        <View className="flex-row bg-popover rounded-lg p-1">
          {(["monthly", "quarterly", "yearly"] as TimePeriod[]).map(period => (
            <Pressable
              key={period}
              onPress={() => setTimePeriod(period)}
              className={`flex-1 py-3 px-4 rounded-md items-center ${timePeriod === period ? "bg-primary" : ""}`}
            >
              <Text
                className={`${timePeriod === period ? "text-primary-foreground" : "text-muted-foreground"} font-semibold capitalize`}
              >
                {period}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" colors={["#10b981"]} />
        }
      >
        {comparisonData.length > 0 ? (
          <View className="flex-1">
            {/* Main Table Container - Two Column Layout */}
            <View className="flex-row">
              {/* --- COLUMN 1: STICKY CATEGORIES (Header + Body) --- */}
              <View style={{ width: CATEGORY_COLUMN_WIDTH }} className=" border-slate-300">
                {/* Sticky Category Header */}
                <View className="bg-popover border-b-2 border-border py-4 px-4">
                  <Text className="font-bold text-sm text-foreground">Category</Text>
                </View>

                {/* Sticky Category Body */}
                {Object.entries(groupedData).map(([groupName, categories]) => (
                  <View key={groupName}>
                    {/* Group Header - Category Column */}
                    <View className="bg-popover py-3 border-b border-border px-4" style={{ height: 58 }}>
                      <View className="flex-row items-center h-full">
                        <View className="w-7 h-7 items-center justify-center mr-2">
                          {Object.values(categories)[0]?.[0]?.groupIcon && (
                            <MyIcon
                              name={Object.values(categories)[0][0].groupIcon!}
                              size={18}
                              className="text-foreground"
                            />
                          )}
                        </View>
                        <Text className="font-bold text-base text-foreground flex-1">{groupName}</Text>
                      </View>
                    </View>

                    {/* Category Rows - Category Column */}
                    {Object.entries(categories).map(([categoryName, categoryTransactions], categoryIndex) => {
                      // Calculate if any period has a budget to determine row height
                      const hasBudget = periods.some((_, periodIndex) => {
                        const transaction = categoryTransactions[periodIndex];
                        const amount = transaction?.amount || 0;
                        const budget = transaction?.budget || 0;
                        return budget > 0 && amount > 0;
                      });

                      // Dynamic height: base height + budget bar space if needed
                      const rowHeight = hasBudget ? 50 : 50;

                      return (
                        <View
                          key={`${groupName}-${categoryName}`}
                          className={`${
                            categoryIndex % 2 === 0 ? "bg-card" : "bg-background"
                          } py-2 border-b border-border px-4`}
                          style={{ height: rowHeight }}
                        >
                          <View className="flex-row items-center pl-4 h-full">
                            <View className="w-6 h-6 items-center justify-center mr-2">
                              {categoryTransactions[0]?.categoryIcon && (
                                <MyIcon
                                  name={categoryTransactions[0].categoryIcon!}
                                  size={16}
                                  className="text-muted-foreground"
                                />
                              )}
                            </View>
                            <Text className="text-sm text-muted-foreground flex-1" numberOfLines={2}>
                              {categoryName}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {/* Totals Row - Category Column */}
                <View className="bg-primary py-4 border-t-2 border-border px-4">
                  <Text className="font-bold text-base text-primary-foreground">Total</Text>
                </View>
              </View>

              {/* --- COLUMN 2: SCROLLABLE DATA (Header + Body) --- */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} className="bg-card">
                <View>
                  {/* Scrollable Period Headers */}
                  <View className="flex-row bg-popover border-b-2 border-border py-4">
                    {periods.map((period, index) => (
                      <View key={index} style={{ width: columnWidth }} className="px-2">
                        <Text className="font-bold text-sm text-foreground text-center" numberOfLines={2}>
                          {period.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Scrollable Data Body */}
                  {Object.entries(groupedData).map(([groupName, categories]) => (
                    <View key={groupName}>
                      {/* Group Header - Data Columns */}
                      <View className="flex-row bg-popover py-3 border-b border-border" style={{ height: 58 }}>
                        {periods.map((period, periodIndex) => {
                          const groupTotal = Object.values(categories).reduce(
                            (sum, categoryTransactions) => sum + (categoryTransactions[periodIndex]?.amount || 0),
                            0,
                          );
                          const previousTotal =
                            periodIndex > 0
                              ? Object.values(categories).reduce(
                                  (sum, categoryTransactions) =>
                                    sum + (categoryTransactions[periodIndex - 1]?.amount || 0),
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
                              <View className="flex-row items-center justify-center" style={{ gap: 4 }}>
                                <Text
                                  className={`font-semibold text-sm text-center ${
                                    hasIncrease
                                      ? "text-red-500"
                                      : hasDecrease
                                        ? "text-success-500"
                                        : "text-typography-700"
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

                      {/* Category Rows - Data Columns */}
                      {Object.entries(categories).map(([categoryName, categoryTransactions], categoryIndex) => {
                        // Calculate if any period has a budget to determine row height
                        const hasBudget = periods.some((_, periodIndex) => {
                          const transaction = categoryTransactions[periodIndex];
                          const amount = transaction?.amount || 0;
                          const budget = transaction?.budget || 0;
                          return budget > 0 && amount > 0;
                        });

                        // Dynamic height: base height + budget bar space if needed
                        const rowHeight = hasBudget ? 50 : 50;

                        return (
                          <View
                            key={`${groupName}-${categoryName}`}
                            className={`flex-row ${
                              categoryIndex % 2 === 0 ? "bg-card" : "bg-background"
                            } py-2 border-b border-border`}
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
                                <View key={periodIndex} style={{ width: columnWidth }} className="px-2">
                                  <View className="items-center justify-center h-full">
                                    <View className="flex-row items-center justify-center mb-1" style={{ gap: 4 }}>
                                      <Text
                                        className={`text-sm text-center ${
                                          hasIncrease
                                            ? "text-red-500"
                                            : hasDecrease
                                              ? "text-success-500"
                                              : "text-typography-700"
                                        } font-medium`}
                                        // } ${amount > 0 ? "font-medium" : "font-normal"}`}
                                      >
                                        {formatCurrency(amount)}
                                      </Text>
                                      {hasBudget ? (
                                        <Text className="text-sm text-muted-foreground">
                                          / {formatCurrency(budget)}
                                        </Text>
                                      ) : (
                                        ""
                                      )}
                                      {hasIncrease && <ArrowUp size={12} color="#ef4444" />}
                                      {hasDecrease && <ArrowDown size={12} color="#10b981" />}
                                    </View>

                                    {/* Budget Progress Bar */}
                                    {budget > 0 && amount > 0 && (
                                      <View className="w-full flex items-center">
                                        <View
                                          style={{ width: columnWidth / 2 }}
                                          className="h-2 bg-gray-200 rounded-full overflow-hidden relative"
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

                  {/* Totals Row - Data Columns */}
                  <View className="flex-row bg-primary py-4 border-t-2 border-border">
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
                          <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
                            <Text className="font-bold text-base text-primary-foreground text-center">
                              {formatCurrency(periodData.totalExpenses)}
                            </Text>
                            {hasIncrease && <ArrowUp size={16} color="#fca5a5" />}
                            {hasDecrease && <ArrowDown size={16} color="#86efac" />}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center p-10 bg-white">
            <Text className="text-base text-slate-500 text-center">No transaction data available for comparison</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
