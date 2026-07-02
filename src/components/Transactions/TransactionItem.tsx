import MyIcon from "@/src/components/elements/MyIcon";
import { Text as ThemedText, triggerHaptic } from "@/src/components/ui";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import { formatMoney } from "@/src/utils/currency";
import { getTransactionProp } from "@/src/utils/transactions.helper";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import TransactionAmount from "./TransactionAmount";

export default function TransactionItem({
  transaction,
  selectedTransactions,
  handleLongPress,
  handlePress,
  transferTransaction,
}: {
  transaction: TransactionsView;
  selectedTransactions: TransactionsView[];
  handleLongPress: (item: TransactionsView, transferItem?: TransactionsView) => void;
  handlePress: (item: TransactionsView, transferItem?: TransactionsView) => void;
  transferTransaction?: TransactionsView;
}) {
  const isSelected = selectedTransactions.find(t => t.id === transaction.id);
  const iconProp = getTransactionProp(transaction.type);
  const isTransfer = transaction.type === "Transfer";
  const isPositiveTransferSide = isTransfer && transaction.amount! > 0;
  const { primaryCurrency } = usePrimaryCurrency();
  const amount = isTransfer ? Math.abs(transaction.amount ?? 0) : transaction.amount ?? 0;

  // Hide the positive-amount side of a transfer (the paired row) only when
  // its counterpart (negative side) is also present in the current list.
  // When filtering by account, only one side may be present — render it normally.
  if (isPositiveTransferSide && transferTransaction) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-between">
      <Link href={`/AddTransaction?id=${transaction.id}`} asChild onPress={e => e.preventDefault()}>
        <Pressable
          delayLongPress={300}
          onLongPress={() => {
            triggerHaptic("light");
            handleLongPress(transaction, transferTransaction);
          }}
          onPress={() => {
            triggerHaptic("light");
            handlePress(transaction, transferTransaction);
          }}
          className={`m-2 p-3 flex-row items-center justify-between gap-5 flex-1 rounded-lg border ${isSelected ? "bg-primary-soft border-primary" : "bg-surface border-border"}`}
          testID={`transaction-item-${transaction.id}`}
          accessibilityRole="link"
          style={({ pressed }) => [
            {
              opacity: pressed ? 0.8 : 1,
              transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
            },
          ]}
        >
          <View
            className={`rounded-full h-10 w-10 flex justify-center items-center bg-${iconProp.color} border border-border`}
          >
            <MyIcon
              name={transaction.icon ?? iconProp.iconName}
              size={iconProp.size}
              className={`text-${iconProp.textColor}`}
            />
          </View>
          <View className="flex-1">
            <ThemedText className={`font-sans-semibold ${transaction.isvoid ? "line-through" : ""}`}>
              {transaction.name ?? transaction.categoryname ?? "Hello"}
            </ThemedText>
            {transaction.name !== transaction.categoryname && (
              <View className="flex-row justify-start items-center gap-2">
                <ThemedText variant="caption" className={transaction.isvoid ? "line-through" : ""}>
                  {transaction.categoryname}
                </ThemedText>
              </View>
            )}
          </View>
          <View className="flex items-end">
            <TransactionAmount amount={amount} color={iconProp.textColor} showSigned={!isTransfer} />
            <ThemedText variant="caption" className={transaction.isvoid ? "line-through" : ""}>
              {transaction.accountname} {" | "}
              {formatMoney(transaction.runningbalance ?? 0, primaryCurrency)}
            </ThemedText>
            {isTransfer && transferTransaction && (
              <View className="flex-row items-center justify-center gap-2">
                <MyIcon name="ArrowRight" size={15} className="text-ink-mute" />

                <ThemedText variant="caption" className={transferTransaction.isvoid ? "line-through" : ""}>
                  {transferTransaction.accountname} {" | "}
                  {formatMoney(transferTransaction.runningbalance ?? 0, primaryCurrency)}
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
