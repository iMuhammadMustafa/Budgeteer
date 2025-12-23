import DashboardCharts from "@/src/components/Charts/DashboardCharts";
import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { router } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useDashboard from "./useDashboardViewModel";

export default function DetailView() {
  const {
    dailyTransactionTypesData,
    weeklyTransactionTypesData,
    monthlyCategories,
    monthlyGroups,
    handleDayPress,
    handlePiePress,
    handleTransactionPress,
    params,
    filteredTransactions,
    isLoading,
    handleViewAllNavigation,
    periodControls,
  } = useDashboard({ fetchTransactions: true });

  return (
    <SafeAreaView className="w-full h-full flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="mx-4 mt-2">
          <View className="flex-row justify-between items-center mb-2">
            <Button
              variant="ghost"
              leftIcon="ArrowLeft"
              className="py-0 px-2"
              textClasses="font-bold"
              iconSize={22}
              label={params.label}
              size="lg"
              onPress={() => router.replace("/Dashboard")}
            />
            <View className="flex-row gap-2">
              <Button variant="primary" onPress={handleViewAllNavigation} label="View All" />
            </View>
          </View>

          <DashboardCharts
            weeklyTransactionTypesData={weeklyTransactionTypesData}
            dailyTransactionTypesData={dailyTransactionTypesData}
            monthlyCategories={monthlyCategories}
            monthlyGroups={monthlyGroups}
            handleDayPress={handleDayPress}
            handlePiePress={handlePiePress}
            params={params}
            periodControls={periodControls}
          />
        </View>

        <View className="flex-1 px-4">
          {isLoading ? (
            <DaySkeleton />
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-muted">No transactions found</Text>
            </View>
          ) : (
            <TransactionsListComponent transactions={filteredTransactions} onPress={handleTransactionPress} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionsListComponent({
  transactions,
  onPress,
}: {
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
}) {
  return (
    <FlatList
      className="flex-1"
      data={transactions}
      keyExtractor={item => item.id?.toString() || Math.random().toString()}
      renderItem={({ item }) => {
        const isExpense = item.amount ? item.amount < 0 : false;
        const localDate = dayjs(item.date || new Date()).local();
        const iconToUse = (item as any).groupicon || item.icon;

        return (
          <Pressable
            onPress={() => onPress(item)}
            className="flex-row items-center justify-between p-4 bg-card/30 rounded-lg mb-2"
          >
            <View className="flex-row items-center flex-1">
              {iconToUse && (
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <MyIcon name={iconToUse} size={20} color="#4CAF50" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base text-foreground font-medium">{item.name || "Unnamed Transaction"}</Text>
                <Text className="text-sm text-muted-foreground">
                  {(item as any).groupname && item.categoryname
                    ? `${(item as any).groupname} • ${item.categoryname}`
                    : item.categoryname || "Uncategorized"}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className={`text-base font-medium ${isExpense ? "text-danger-500" : "text-success-500"}`}>
                {isExpense ? "-" : "+"}${Math.abs(item.amount || 0).toFixed(2)}
              </Text>
              <Text className="text-sm text-muted-foreground">{localDate.format("MMM D, YYYY")}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}
