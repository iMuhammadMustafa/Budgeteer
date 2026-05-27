import { PeriodData } from "@/src/components/Summary/SummaryTableHeader";
import { Text, View } from "react-native";
import MyIcon from "../elements/MyIcon";

export interface TransactionData {
  group: string;
  category: string;
  amount: number;
  budget: number;
  groupIcon?: string | null;
  categoryIcon?: string | null;
  groupBudget?: number | null;
}

export default function SummaryLeftLegend({
  groupedData,
  periods,
  columnWidth,
}: {
  groupedData: Record<string, Record<string, any[]>>;
  periods: PeriodData[];
  columnWidth: number;
}) {
  return (
    <View
      style={{
        width: columnWidth,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
      className="bg-surface border-r border-border-default/40 z-10"
    >
      {Object.entries(groupedData).map(([groupName, categories]) => (
        <View key={groupName}>
          {/* Group Header */}
          <View
            className="bg-surface-elevated/40 py-3 border-b border-border-default/50 px-4 justify-center"
            style={{ height: 58 }}
          >
            <View className="flex-row items-center h-full">
              <View className="w-8 h-8 items-center justify-center mr-2 rounded-full bg-background border border-border-default/30">
                {Object.values(categories)[0]?.[0]?.groupIcon && (
                  <MyIcon name={Object.values(categories)[0][0].groupIcon!} size={16} className="text-foreground" />
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
  );
}
