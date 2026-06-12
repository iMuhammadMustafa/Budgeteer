import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { TransactionData } from "./SummaryLeftLegend";
import { PeriodData } from "./SummaryTableHeader";

export interface PeriodComparison {
  period: PeriodData;
  transactions: TransactionData[];
  totalExpenses: number;
}

export default function SummaryFooter({
  comparisonData,
  columnWidth,
}: {
  comparisonData: PeriodComparison[];
  columnWidth: number;
}) {
  const { formatCurrency } = usePrimaryCurrency();

  return (
    <View className="flex-row bg-primary/5 py-4 border-t border-border-default" style={{ height: 64 }}>
      {comparisonData.map((periodData, periodIndex) => {
        const previousTotal = periodIndex > 0 ? comparisonData[periodIndex - 1].totalExpenses : null;
        const hasIncrease = previousTotal !== null && periodData.totalExpenses > previousTotal;
        const hasDecrease = previousTotal !== null && periodData.totalExpenses < previousTotal;

        return (
          <View key={periodIndex} style={{ width: columnWidth }} className="px-2 items-center justify-center h-full">
            <View
              className="flex-row items-center justify-center bg-background py-2 px-4 rounded-xl border border-border-default/50"
              style={{
                gap: 6,
                elevation: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Text className="font-bold text-[15px] text-foreground text-center tracking-tight">
                {formatCurrency(periodData.totalExpenses, false)}
              </Text>
              {hasIncrease && <ArrowUp size={14} color="#ef4444" />}
              {hasDecrease && <ArrowDown size={14} color="#10b981" />}
            </View>
          </View>
        );
      })}
    </View>
  );
}
