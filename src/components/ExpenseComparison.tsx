import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import MyIcon from "./elements/MyIcon";

export type ExpenseComparisonData = {
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
};

type Props = {
  data: ExpenseComparisonData[];
};

export default function ExpenseComparison({ data }: Props) {
  const { width } = useWindowDimensions();
  const groupedData = transformData(data);

  // Dates for columns
  const dates = [...new Set(data.map(d => d.date))];
  dates.sort((a, b) => {
    const dateA = new Date(a.includes(" ") ? a : `${a}-01`);
    const dateB = new Date(b.includes(" ") ? b : `${b}-01`);
    return dateA.getTime() - dateB.getTime();
  });

  // Helper: find transaction info
  const findTransactionInfo = (group: string, category?: string) => {
    for (const dateData of data) {
      for (const transaction of dateData.transactions) {
        if (category) {
          if (transaction.group === group && transaction.category === category) {
            return transaction;
          }
        } else {
          if (transaction.group === group) {
            return transaction;
          }
        }
      }
    }
    return null;
  };

  // Helper: render amount cell
  const renderAmount = (current: number, previous: number | undefined) => {
    const hasChanged = previous !== undefined;
    const hasIncreased = hasChanged && current > previous;
    const hasDecreased = hasChanged && current < previous;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center" }}>
        <Text
          style={{
            fontVariant: ["tabular-nums"],
            color: hasIncreased ? "#ef4444" : hasDecreased ? "#22c55e" : "#1e293b",
          }}
        >
          ${Math.abs(current).toFixed(2)}
        </Text>
        {hasIncreased && <ArrowUp size={16} color="#ef4444" />}
        {hasDecreased && <ArrowDown size={16} color="#22c55e" />}
      </View>
    );
  };

  // Group totals for each date
  const groupTotals: Record<string, Record<string, number>> = {};
  Object.entries(groupedData).forEach(([group, categories]) => {
    groupTotals[group] = {};
    dates.forEach(date => {
      groupTotals[group][date] = Object.values(categories).reduce((sum, dateAmounts) => {
        return sum + (dateAmounts[date] || 0);
      }, 0);
    });
  });

  // Responsive cell widths
  const minCellWidth = 120;
  const responsiveWidth = Math.max(minCellWidth, width / (dates.length + 2.5));
  const categoryWidth = Math.min(responsiveWidth * 1.2, 180);
  const amountWidth = Math.min(responsiveWidth, 130);

  // Overall totals for each date
  const overallTotals: Record<string, number> = {};
  dates.forEach(date => {
    overallTotals[date] = data.find(d => d.date === date)?.transactions.reduce((sum, t) => sum + t.amount, 0) || 0;
  });

  // Helper: budget usage
  const calculateBudgetUsage = (amount: number, budget?: number): number => {
    if (!budget || budget <= 0) return 0;
    return Math.min(Math.abs(amount) / budget, 1);
  };
  const getGradientColors = (usage: number): string[] => {
    if (usage <= 0.5) return ["#4CAF50", "#FFC107"];
    else return ["#FFC107", "#F44336"];
  };

  return (
    <View style={{ flex: 1, width: "100%", justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}>
      <ScrollView
        horizontal
        style={{ flex: 1 }}
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            justifyContent: "center",
            alignItems: "center",
            minWidth: categoryWidth + amountWidth * dates.length,
            maxWidth: width - 32,
            alignSelf: "center",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                width: categoryWidth,
                textAlign: "center",
                fontWeight: "bold",
                color: "#1e293b",
                paddingHorizontal: 8,
              }}
              numberOfLines={1}
            >
              Category
            </Text>
            {dates.map(date => (
              <Text
                key={date}
                style={{
                  width: amountWidth,
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#1e293b",
                  paddingHorizontal: 8,
                }}
                numberOfLines={1}
              >
                {date}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {Object.entries(groupedData).map(([group, categories], groupIndex) => {
            const groupInfo = findTransactionInfo(group);
            const groupIcon = groupInfo?.groupIcon;
            const groupBudget = groupInfo?.groupBudget || 0;
            const currentGroupTotal = groupTotals[group][dates[dates.length - 1]] || 0;
            const groupBudgetUsage = calculateBudgetUsage(currentGroupTotal, groupBudget);
            const groupGradientColors = getGradientColors(groupBudgetUsage);
            return (
              <View key={group}>
                {/* Group Header with totals */}
                <View style={{ paddingVertical: 8, paddingHorizontal: 4, backgroundColor: "#f3f4f6" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{ width: categoryWidth, flexDirection: "row", alignItems: "center", paddingHorizontal: 8 }}
                    >
                      {groupIcon && <MyIcon name={groupIcon} style={{ color: "#1e293b", marginRight: 4 }} size={18} />}
                      <Text style={{ fontWeight: "bold", color: "#1e293b" }} numberOfLines={1}>
                        {group}
                      </Text>
                    </View>
                    {dates.map(date => {
                      const amount = groupTotals[group][date];
                      return (
                        <View key={date} style={{ width: amountWidth, alignItems: "center", paddingHorizontal: 8 }}>
                          {renderAmount(amount, groupTotals[group][dates[dates.length - 2]])}
                        </View>
                      );
                    })}
                  </View>
                  {/* Group Budget Progress Bar */}
                  {groupBudget > 0 && (
                    <View style={{ paddingHorizontal: 8, marginTop: 8 }}>
                      <View style={{ height: 8, backgroundColor: "#fff", borderRadius: 8, overflow: "hidden" }}>
                        <LinearGradient
                          colors={groupGradientColors as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${groupBudgetUsage * 100}%`, height: "100%" }}
                        />
                      </View>
                      <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }} numberOfLines={1}>
                        Budget: ${Math.abs(currentGroupTotal).toFixed(2)} / ${groupBudget.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Categories */}
                {Object.entries(categories).map(([category, dateAmounts], index) => {
                  const categoryInfo = findTransactionInfo(group, category);
                  const categoryIcon = categoryInfo?.categoryIcon;
                  const categoryBudget = categoryInfo?.categoryBudget || 0;
                  const currentAmount = dateAmounts[dates[dates.length - 1]] || 0;
                  const budgetUsage = calculateBudgetUsage(currentAmount, categoryBudget);
                  const gradientColors = getGradientColors(budgetUsage);
                  return (
                    <View
                      key={`${group}-${category}`}
                      style={{
                        borderBottomWidth: 1,
                        borderColor: "#e5e7eb",
                        backgroundColor: index % 2 === 0 ? "#f3f4f6" : "#fff",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                        <View
                          style={{
                            width: categoryWidth,
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 8,
                          }}
                        >
                          {categoryIcon && (
                            <MyIcon name={categoryIcon} style={{ color: "#1e293b", marginRight: 4 }} size={16} />
                          )}
                          <Text style={{ color: "#1e293b", fontSize: 14, flexShrink: 1 }} numberOfLines={2}>
                            {category}
                          </Text>
                        </View>
                        {dates.map(date => (
                          <View key={date} style={{ width: amountWidth, alignItems: "center", paddingHorizontal: 8 }}>
                            {renderAmount(dateAmounts[date] || 0, dateAmounts[dates[dates.length - 2]])}
                          </View>
                        ))}
                      </View>
                      {/* Budget Progress Bar (only show if there's a budget) */}
                      {categoryBudget > 0 && (
                        <View style={{ paddingHorizontal: 8, paddingBottom: 8, marginLeft: 30 }}>
                          <View style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                            <LinearGradient
                              colors={gradientColors as [string, string]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ width: `${budgetUsage * 100}%`, height: "100%" }}
                            />
                          </View>
                          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }} numberOfLines={1}>
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              borderTopWidth: 2,
              borderColor: "#e5e7eb",
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                width: categoryWidth,
                textAlign: "center",
                fontWeight: "bold",
                color: "#1e293b",
                paddingHorizontal: 8,
              }}
              numberOfLines={1}
            >
              Total
            </Text>
            {dates.map(date => (
              <View key={date} style={{ width: amountWidth, alignItems: "center", paddingHorizontal: 8 }}>
                <Text
                  style={{ fontWeight: "bold", color: "#1e293b", fontSize: 14, textAlign: "center" }}
                  numberOfLines={1}
                >
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

// Helper: transform data
export function transformData(data: ExpenseComparisonData[]): Record<string, Record<string, Record<string, number>>> {
  const grouped: Record<string, Record<string, Record<string, number>>> = {};
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
