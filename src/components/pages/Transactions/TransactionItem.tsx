import { TransactionsView } from "@/src/types/db/Tables.Types";
import MyIcon from "@/src/utils/Icons.Helper";
import { getTransactionProp } from "@/src/utils/transactions.helper";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function TransactionItem({
  transaction,
  selectedTransactions,
  handleLongPress,
  handlePress,
}: {
  transaction: TransactionsView;
  selectedTransactions: TransactionsView[];
  handleLongPress: (item: TransactionsView) => void;
  handlePress: (item: TransactionsView) => void;
}) {
  const isSelected = selectedTransactions.find(t => t.id === transaction.id);
  const iconProp = getTransactionProp(transaction.type);

  return (
    <View className="flex-row items-center justify-between">
      <Link href={`/AddTransaction?id=${transaction.id}`} asChild onPress={e => e.preventDefault()}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
          delayLongPress={300}
          onLongPress={() => handleLongPress(transaction)}
          onPress={() => handlePress(transaction)}
          className={`m-2 p-1 flex-row items-center justify-between gap-5 flex-1 rounded-md ${isSelected ? "bg-info-100" : "bg-background"}`}
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
            <Text className={`text-foreground ${transaction.status === "None" ? "" : "line-through"}`}>
              {transaction.description ?? transaction.categoryname ?? "Hello"}
            </Text>
            <View className="flex-row justify-start items-center gap-2">
              <Text className={`text-foreground ${transaction.status === "None" ? "" : "line-through"}`}>
                {transaction.categoryname}
              </Text>
            </View>
          </View>
          <View className="flex items-end">
            <Text className={`text-${getTransactionProp(transaction.type).textColor}`}>
              {transaction.amount!.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {transaction.currency}
            </Text>
            <Text className={`text-foreground ${transaction.status === "None" ? "" : "line-through"}`}>
              {transaction.accountname} {" | "}
              {transaction.running_balance?.toLocaleString("en", {
                style: "currency",
                currency: transaction.currency!,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}
