import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { TransactionData } from "./SummaryLeftLegend";
import { PeriodData } from "./SummaryTableHeader";

const getGradientColors = (usage: number): [string, string, string] => {
  //   if (usage <= 0.5) return ["#10b981", "#f59e0b"];
  //   if (usage <= 0.8) return ["#f59e0b", "#ef4444"];
  //   return ["#ef4444", "#dc2626"];

  return ["#10b981", "#f59e0b", "#ef4444"];
};

export default function CategoryRowData({
  groupName,
  categories,
  periods,
  columnWidth,
}: {
  groupName: string;
  categories: Record<string, TransactionData[]>;
  periods: PeriodData[];
  columnWidth: number;
}) {
  const { formatCurrency } = usePrimaryCurrency();

  return Object.entries(categories).map(([categoryName, categoryTransactions], categoryIndex) => {
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

          const previousAmount = periodIndex > 0 ? categoryTransactions[periodIndex - 1]?.amount || 0 : null;

          const hasIncrease = previousAmount !== null && amount > previousAmount;
          const hasDecrease = previousAmount !== null && amount < previousAmount;

          return (
            <View key={periodIndex} style={{ width: columnWidth }} className="px-2 justify-center">
              <View className="items-center justify-center h-full">
                <View className="flex-row items-center justify-center mb-1.5" style={{ gap: 4 }}>
                  <Text
                    className={`text-[13px] text-center ${
                      hasIncrease
                        ? "text-status-danger font-medium"
                        : hasDecrease
                          ? "text-status-success font-medium"
                          : "text-foreground font-medium"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </Text>
                  {hasBudget ? (
                    <Text className="text-[11px] text-muted-foreground/70 font-medium">/ {formatCurrency(budget)}</Text>
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
  });
}
