import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { TransactionData } from "./SummaryLeftLegend";
import { PeriodData } from "./SummaryTableHeader";

export default function SummaryGroupData({
  categories,
  periods,
  columnWidth,
}: {
  categories: Record<string, TransactionData[]>;
  periods: PeriodData[];
  columnWidth: number;
}) {
  const { formatCurrency } = usePrimaryCurrency();

  return (
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
          <View key={periodIndex} style={{ width: columnWidth }} className="px-2 items-center justify-center h-full">
            <View
              className="flex-row items-center justify-center bg-background/50 py-1.5 px-3 rounded-lg"
              style={{ gap: 4 }}
            >
              <Text
                className={`font-semibold text-sm text-center text-foreground`}
                //${hasIncrease ? "text-status-danger" : hasDecrease ? "text-status-success" : "text-foreground"}
              >
                {formatCurrency(groupTotal, false)}
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
