/**
 * a titled Card with bare ListRows (divider-separated).
 * Icon tile tone follows income/expense since the transactions view carries no per-category color.
 * Pure presentation.
 *
 * Sits beside the Week's Expenses ChartCard in a stretched flex row (see
 * `DashboardCharts`) — `className` lets the parent force `flex-1`/`h-full` so this
 * card matches that sibling's height; the list scrolls internally rather than
 * growing past it.
 */
import { ScrollView, View } from "react-native";
import dayjs from "dayjs";

import { useTheme } from "@/src/providers/ThemeProvider";
import type { TransactionsView } from "@/src/types/database/Tables.Types";
import { Divider, ListRow } from "@/src/components/ui";

export default function RecentTransactions({
  transactions = [],
  onPress,
  className,
}: {
  transactions?: TransactionsView[];
  onPress: (t: TransactionsView) => void;
  className?: string;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView className="flex-1 custom-scrollbar">
      {transactions.map((t, i) => {
        const expense = (t.amount ?? 0) < 0;
        return (
          <View key={t.id ?? i}>
            {i > 0 ? <Divider /> : null}
            <ListRow
              bare
              iconName={t.groupicon || t.icon || "Receipt"}
              iconColor={expense ? colors.expense : colors.income}
              iconBg={expense ? colors.expenseSoft : colors.incomeSoft}
              iconShape="circle"
              title={t.name || "Transaction"}
              subtitle={t.categoryname || t.accountname || "Uncategorized"}
              amount={t.amount ?? 0}
              subAmount={t.date ? dayjs(t.date).format("MMM D") : undefined}
              onPress={() => onPress(t)}
              testID={`recent-tx-${t.id}`}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
