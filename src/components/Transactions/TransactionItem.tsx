import { triggerHaptic } from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import { getTransactionProp } from "@/src/utils/transactions.helper";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
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
  handleLongPress: (item: TransactionsView, transferItem: TransactionsView) => void;
  handlePress: (item: TransactionsView, transferItem: TransactionsView) => void;
  transferTransaction?: TransactionsView;
}) {
  const isSelected = selectedTransactions.find(t => t.id === transaction.id);
  const iconProp = getTransactionProp(transaction.type);
  const isTransfer = transaction.type === "Transfer";
  const isPositiveTransferSide = isTransfer && transaction.amount! > 0;

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
          className={`m-2 p-1 flex-row items-center justify-between gap-5 flex-1 rounded-md ${isSelected ? "bg-info-100" : "bg-background"}`}
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
            className={`rounded-full h-10 w-10 flex justify-center items-center bg-${iconProp.color} border border-muted`}
          >
            <MyIcon
              name={transaction.icon ?? iconProp.iconName}
              size={iconProp.size}
              className="color-card-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className={`text-foreground ${transaction.isvoid ? "line-through" : ""}`}>
              {transaction.name ?? transaction.categoryname ?? "Hello"}
            </Text>
            {transaction.name !== transaction.categoryname && (
              <View className="flex-row justify-start items-center gap-2">
                <Text className={`text-foreground ${transaction.isvoid ? "line-through" : ""}`}>
                  {transaction.categoryname}
                </Text>
              </View>
            )}
          </View>
          <View className="flex items-end">
            <TransactionAmount amount={transaction.amount ?? 0} currency={transaction.currency} color={iconProp.textColor} />
            <Text className={`text-foreground ${transaction.isvoid ? "line-through" : ""}`}>
              {transaction.accountname} {" | "}
              {transaction.runningbalance?.toLocaleString("en", {
                style: "currency",
                currency: transaction.currency || "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            {isTransfer && transferTransaction && (
              <View className="flex-row items-center justify-center gap-2">
                <MyIcon name="ArrowRight" size={15} className="text-foreground" />

                <Text className={`text-foreground ${transferTransaction.isvoid ? "line-through" : ""}`}>
                  {transferTransaction.accountname} {" | "}
                  {transferTransaction.runningbalance?.toLocaleString("en", {
                    style: "currency",
                    currency: transferTransaction.currency!,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
