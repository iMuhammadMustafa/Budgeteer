/**
 * RecentTransactions — the dashboard's latest-activity card: a titled Card with
 * bare ListRows (divider-separated). Icon tile tone follows income/expense since
 * the transactions view carries no per-category color. Pure presentation.
 *
 * Sits beside the Week's Expenses ChartCard in a stretched flex row (see
 * `DashboardCharts`) — `className` lets the parent force `flex-1`/`h-full` so this
 * card matches that sibling's height; the list scrolls internally rather than
 * growing past it.
 */
import { ScrollView, View } from "react-native";

import { Card, Divider, ListRow, Text } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import type { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";

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
    <Card className={`h-full gap-2 ${className ?? ""}`} testID="recent-transactions">
      <Text variant="overline">Recent transactions</Text>
      {transactions.length === 0 ? (
        <Text variant="caption" className="py-6 text-center">
          No recent transactions
        </Text>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
      )}
    </Card>
  );
}
