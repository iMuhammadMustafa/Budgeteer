import ChartSwitcher from "@/src/components/dashboard/ChartSwitcher";
import { Button, Text as ThemedText } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { router } from "expo-router";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import useDashboard from "./useDashboardViewModel";

export default function DetailView() {
  const {
    dailyTransactionTypesData,
    weeklyTransactionTypesData,
    monthlyCategories,
    monthlyGroups,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    params,
    filteredTransactions,
    isLoading,
    handleViewAllNavigation,
    periodControls,
  } = useDashboard({ fetchTransactions: true });

  return (
    <ScrollView className="flex-1">
      <View className="mx-4 mt-2">
        <View className="flex-row justify-between items-center mb-2">
          <Button
            variant="ghost"
            leadingIcon="ArrowLeft"
            className="py-0 px-2"
            iconSize={22}
            label={params.label ?? ""}
            size="lg"
            onPress={() => router.replace("/Dashboard")}
          />
          <View className="flex-row gap-2">
            <Button variant="primary" onPress={handleViewAllNavigation} label="View All" />
          </View>
        </View>

        <ChartSwitcher
          weeklyTransactionTypesData={weeklyTransactionTypesData}
          dailyTransactionTypesData={dailyTransactionTypesData}
          monthlyCategories={monthlyCategories}
          monthlyGroups={monthlyGroups}
          handleDayPress={handleDayPress}
          handlePiePress={handlePiePress}
          handleBarPress={handleBarPress}
          params={params}
          periodControls={periodControls}
        />
      </View>

      <View className="flex-1 px-4">
        {isLoading ? (
          <DaySkeleton />
        ) : !filteredTransactions || filteredTransactions.length === 0 ? (
          <ThemedText variant="h3" className="self-center p-4">
            No transactions found
          </ThemedText>
        ) : (
          <TransactionsListComponent transactions={filteredTransactions} onPress={handleTransactionPress} />
        )}
      </View>
    </ScrollView>
  );
}

function TransactionsListComponent({
  transactions,
  onPress,
}: {
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
}) {
  const { formatCurrency } = usePrimaryCurrency();
  return (
    <FlatList
      className="flex-1"
      data={transactions}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => {
        const isExpense = item.amount ? item.amount < 0 : false;
        const localDate = dayjs(item.date || new Date()).local();
        const iconToUse = (item as any).groupicon || item.icon || "ShoppingCart";
        const iconColor = isExpense ? "danger" : "success";

        return (
          <Pressable
            onPress={() => onPress(item)}
            className="flex-row items-center justify-between p-4 bg-card rounded-lg mb-2 active:opacity-70"
            testID={`detail-transaction-${item.id}`}
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full bg-${iconColor}-200 items-center justify-center mr-3`}>
                <MyIcon name={iconToUse} size={20} />
              </View>

              <View className="flex-1">
                <ThemedText variant="label" className="text-base">
                  {item.name || "Unnamed Transaction"}
                </ThemedText>
                <ThemedText variant="caption">
                  {(item as any).groupname && item.categoryname
                    ? `${(item as any).groupname} • ${item.categoryname}`
                    : item.categoryname || "Uncategorized"}
                </ThemedText>
              </View>
            </View>
            <View className="items-end">
              <ThemedText variant="label" className={`text-base ${isExpense ? "text-danger-500" : "text-success-500"}`}>
                {formatCurrency(item.amount)}
              </ThemedText>
              <ThemedText variant="caption">{localDate.format("MMM D, YYYY")}</ThemedText>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
