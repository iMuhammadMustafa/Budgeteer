import React from "react";
import { View, FlatList, Pressable } from "react-native";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import ThemedText from "@/src/components/elements/ThemedText";
import MyIcon from "@/src/components/elements/MyIcon";
import dayjs from "dayjs";

export default function RecentTransactions({
  transactions,
  onTransactionPress,
}: {
  transactions: TransactionsView[];
  onTransactionPress: (transaction: TransactionsView) => void;
}) {
  const { formatCurrency } = usePrimaryCurrency();

  return (
    <View className="flex-1 w-full px-2">
      <ThemedText className="text-center text-xl font-bold text-foreground mb-4">
        Recent Transactions
      </ThemedText>
      
      {!transactions || transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center py-8">
          <ThemedText className="text-muted-foreground">No recent transactions</ThemedText>
        </View>
      ) : (
        <View className="flex-col gap-2">
          {transactions.map((item) => {
            const isExpense = item.amount ? item.amount < 0 : false;
            const localDate = dayjs(item.date || new Date()).local();
            const iconToUse = (item as any).groupicon || item.icon || "ShoppingCart";
            const iconColor = isExpense ? "danger" : "success";

            return (
              <Pressable
                key={item.id}
                onPress={() => onTransactionPress(item)}
                className="flex-row items-center justify-between p-3 bg-background rounded-lg border border-border"
                style={({ pressed }) => [
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-full bg-${iconColor}-200 items-center justify-center mr-3`}>
                    <MyIcon name={iconToUse} size={20} className={`text-${iconColor}-700`} />
                  </View>

                  <View className="flex-1">
                    <ThemedText variant="label" className="text-sm" numberOfLines={1}>
                      {item.name || "Unnamed Transaction"}
                    </ThemedText>
                    <ThemedText variant="caption" className="text-xs text-muted-foreground" numberOfLines={1}>
                      {(item as any).groupname && item.categoryname
                        ? `${(item as any).groupname} • ${item.categoryname}`
                        : item.categoryname || "Uncategorized"}
                    </ThemedText>
                  </View>
                </View>
                <View className="items-end pl-2">
                  <ThemedText variant="label" className={`text-sm font-bold ${isExpense ? "text-danger-500" : "text-success-500"}`}>
                    {formatCurrency(item.amount)}
                  </ThemedText>
                  <ThemedText variant="caption" className="text-xs text-muted-foreground">
                    {localDate.format("MMM D")}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
