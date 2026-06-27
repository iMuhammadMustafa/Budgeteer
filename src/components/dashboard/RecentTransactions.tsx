/**
 * RecentTransactions — the dashboard's latest-activity card: a titled Card with
 * bare ListRows (divider-separated). Icon tile tone follows income/expense since
 * the transactions view carries no per-category color. Pure presentation.
 */
import { View } from "react-native";

import { Card, Divider, ListRow, Text } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import type { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";

export default function RecentTransactions({
  transactions = [],
  onPress,
}: {
  transactions?: TransactionsView[];
  onPress: (t: TransactionsView) => void;
}) {
  const { colors } = useTheme();

  return (
    <Card className="gap-2" testID="recent-transactions">
      <Text variant="overline">Recent transactions</Text>
      {transactions.length === 0 ? (
        <Text variant="caption" className="py-6 text-center">
          No recent transactions
        </Text>
      ) : (
        <View>
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
        </View>
      )}
    </Card>
  );
}
