import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { ArrowUp, ArrowDown } from "lucide-react-native";
import MyIcon from "@/src/utils/Icons.Helper";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  data: {
    date: string;
    transactions: {
      category: string;
      group: string;
      amount: number;
      categoryIcon?: string;
      groupIcon?: string;
      categoryBudget?: number;
      groupBudget?: number;
    }[];
  }[];
};

export default function ExpenseComparison({ data }: Props) {
  const { width } = useWindowDimensions();
  const groupedData = transformData(data);

  // Make sure dates are sorted with the most recent (current) date on the right
  const dates = [...new Set(data.map(d => d.date))];
  dates.sort((a, b) => {
    // Parse dates - if they include spaces (month names), use a different format
    const dateA = new Date(a.includes(" ") ? a : `${a}-01`);
    const dateB = new Date(b.includes(" ") ? b : `${b}-01`);
    return dateA.getTime() - dateB.getTime();
  });

  // Helper function to find transaction info across all dates
  const findTransactionInfo = (group: string, category?: string) => {
    // Look through all dates to find the first transaction with the info we need
    for (const dateData of data) {
      for (const transaction of dateData.transactions) {
        if (category) {
          // Looking for specific category info
          if (transaction.group === group && transaction.category === category) {
            return transaction;
          }
        } else {
          // Looking for group info
          if (transaction.group === group) {
            return transaction;
          }
        }
      }
    }
    return null;
  };

  const renderAmount = (current: number, previous: number | undefined) => {
    const hasChanged = previous !== undefined;
    const hasIncreased = hasChanged && current > previous;
    const hasDecreased = hasChanged && current < previous;

    return (
      <View className="flex-row items-center gap-1">
        <Text
          className={`tabular-nums ${hasIncreased ? "text-danger-500" : hasDecreased ? "text-success-500" : "text-foreground"}`}
        >
          ${Math.abs(current).toFixed(2)}
        </Text>
        {hasIncreased && <ArrowUp size={16} color="#ef4444" />}
        {hasDecreased && <ArrowDown size={16} color="#22c55e" />}
      </View>
    );
  };

  // Calculate group totals for each date
  const groupTotals: Record<string, Record<string, number>> = {};

  Object.entries(groupedData).forEach(([group, categories]) => {
    groupTotals[group] = {};

    dates.forEach(date => {
      groupTotals[group][date] = Object.values(categories).reduce((sum, dateAmounts) => {
        return sum + (dateAmounts[date] || 0);
      }, 0);
    });
  });

  // Calculate responsive cell widths
  const minCellWidth = 120;
  const responsiveWidth = Math.max(minCellWidth, width / (dates.length + 2.5));
  const categoryWidth = Math.min(responsiveWidth * 1.2, 180);
  const amountWidth = Math.min(responsiveWidth, 130);

  // Calculate overall totals for each date
  const overallTotals: Record<string, number> = {};
  dates.forEach(date => {
    overallTotals[date] = data.find(d => d.date === date)?.transactions.reduce((sum, t) => sum + t.amount, 0) || 0;
  });

  // Helper function to calculate budget usage percentage
  const calculateBudgetUsage = (amount: number, budget?: number): number => {
    if (!budget || budget <= 0) return 0;
    return Math.min(Math.abs(amount) / budget, 1); // Cap at 100%
  };

  // Helper function to get gradient colors based on usage
  const getGradientColors = (usage: number): string[] => {
    if (usage <= 0.5) {
      // Green to Yellow gradient for usage under 50%
      return ["#4CAF50", "#FFC107"];
    } else {
      // Yellow to Red gradient for usage over 50%
      return ["#FFC107", "#F44336"];
    }
  };

  return (
    <View className="flex-1 w-full items-center justify-center">
      <ScrollView
        horizontal
        className="w-full"
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-start",
          paddingHorizontal: 2,
        }}
      >
        <View
          className="bg-background"
          style={{
            width: Math.min(width - 10, categoryWidth + amountWidth * dates.length),
            alignSelf: "flex-start",
          }}
        >
          {/* Header */}
          <View className="flex-row items-center py-2 border-b border-muted">
            <Text style={{ width: categoryWidth }} className="px-2 font-bold text-foreground" numberOfLines={1}>
              Category
            </Text>
            {dates.map(date => (
              <Text
                key={date}
                style={{ width: amountWidth }}
                className="px-2 font-bold text-foreground text-center"
                numberOfLines={1}
              >
                {date}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {Object.entries(groupedData).map(([group, categories], groupIndex) => {
            // Get group info across all dates
            const groupInfo = findTransactionInfo(group);
            const groupIcon = groupInfo?.groupIcon;
            const groupBudget = groupInfo?.groupBudget || 0;

            // Calculate current group total and budget usage
            const currentGroupTotal = groupTotals[group][dates[dates.length - 1]] || 0;
            const groupBudgetUsage = calculateBudgetUsage(currentGroupTotal, groupBudget);
            const groupGradientColors = getGradientColors(groupBudgetUsage);

            return (
              <View key={group}>
                {/* Group Header with totals */}
                <View className="py-2 px-1 bg-muted">
                  <View className="flex-row items-center">
                    <View style={{ width: categoryWidth }} className="px-2 flex-row items-center">
                      {groupIcon && <MyIcon name={groupIcon} className="text-foreground mr-1" size={18} />}
                      <Text className="font-bold text-foreground" numberOfLines={1}>
                        {group}
                      </Text>
                    </View>
                    {dates.map(date => {
                      const amount = groupTotals[group][date];
                      return (
                        <View key={date} style={{ width: amountWidth }} className="px-2 items-start">
                          {/* <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                            ${Math.abs(amount).toFixed(2)}
                          </Text> */}
                          {renderAmount(amount, groupTotals[group][dates[dates.length - 2]])}
                        </View>
                      );
                    })}
                  </View>

                  {/* Group Budget Progress Bar */}
                  {groupBudget > 0 && (
                    <View className="px-2 mt-2">
                      <View className="h-2 bg-background rounded-full overflow-hidden">
                        <LinearGradient
                          colors={groupGradientColors as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: `${groupBudgetUsage * 100}%`,
                            height: "100%",
                          }}
                        />
                      </View>
                      <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                        Budget: ${Math.abs(currentGroupTotal).toFixed(2)} / ${groupBudget.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Categories */}
                {Object.entries(categories).map(([category, dateAmounts], index) => {
                  // Get category info across all dates
                  const categoryInfo = findTransactionInfo(group, category);
                  const categoryIcon = categoryInfo?.categoryIcon;
                  const categoryBudget = categoryInfo?.categoryBudget || 0;
                  const currentAmount = dateAmounts[dates[dates.length - 1]] || 0;
                  const budgetUsage = calculateBudgetUsage(currentAmount, categoryBudget);
                  const gradientColors = getGradientColors(budgetUsage);

                  return (
                    <View
                      key={`${group}-${category}`}
                      className={`border-b border-muted ${index % 2 === 0 ? "bg-card/20" : ""}`}
                    >
                      <View className="flex-row items-center py-2">
                        <View style={{ width: categoryWidth }} className="px-2 flex-row items-center">
                          {categoryIcon && <MyIcon name={categoryIcon} className="text-foreground mr-1" size={16} />}
                          <Text className="text-foreground text-sm flex-shrink" numberOfLines={2}>
                            {category}
                          </Text>
                        </View>
                        {dates.map(date => (
                          <View key={date} style={{ width: amountWidth }} className="px-2 items-start">
                            {/* <Text className="text-foreground text-sm" numberOfLines={1}>
                              ${Math.abs(dateAmounts[date] || 0).toFixed(2)}
                            </Text> */}
                            {renderAmount(dateAmounts[date] || 0, dateAmounts[dates[dates.length - 2]])}
                          </View>
                        ))}
                      </View>

                      {/* Budget Progress Bar (only show if there's a budget) */}
                      {categoryBudget > 0 && (
                        <View className="px-2 pb-2 ml-2" style={{ marginLeft: 30 }}>
                          <View className="h-2 bg-muted rounded-full overflow-hidden">
                            <LinearGradient
                              colors={gradientColors as [string, string]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{
                                width: `${budgetUsage * 100}%`,
                                height: "100%",
                              }}
                            />
                          </View>
                          <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                            Budget: ${Math.abs(currentAmount).toFixed(2)} / ${categoryBudget.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Totals Row */}
          <View className="flex-row items-center py-2 border-t-2 border-muted bg-muted">
            <Text style={{ width: categoryWidth }} className="px-2 font-bold text-foreground" numberOfLines={1}>
              Total
            </Text>
            {dates.map(date => (
              <View key={date} style={{ width: amountWidth }} className="px-2 items-start">
                <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                  ${Math.abs(overallTotals[date] || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type Transaction = {
  category: string;
  group: string;
  amount: number;
  categoryIcon?: string;
  groupIcon?: string;
  categoryBudget?: number;
  groupBudget?: number;
};

type DayTransactions = {
  date: string;
  transactions: Transaction[];
};

type GroupedExpenses = {
  [group: string]: {
    [category: string]: {
      [date: string]: number;
    };
  };
};

export function transformData(data: DayTransactions[]): GroupedExpenses {
  const grouped: GroupedExpenses = {};

  data.forEach(day => {
    day.transactions.forEach(transaction => {
      if (!grouped[transaction.group]) {
        grouped[transaction.group] = {};
      }
      if (!grouped[transaction.group][transaction.category]) {
        grouped[transaction.group][transaction.category] = {};
      }
      grouped[transaction.group][transaction.category][day.date] = transaction.amount;
    });
  });

  return grouped;
}
