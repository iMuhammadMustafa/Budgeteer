import DashboardCharts from "@/src/components/Charts/DashboardCharts";
import MyIcon from "@/src/components/elements/MyIcon";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
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
  } = useDashboard();

  return (
    <SafeAreaView className="w-full h-full flex-1 bg-background">
      <View className="p-4 bg-card/20 mb-4 rounded-md mx-4 mt-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-foreground flex-1">{params.label}</Text>
          <View className="flex-row gap-2">
            <Pressable className="py-2 px-4 bg-primary/80 rounded-md" onPress={handleViewAllNavigation}>
              <Text className="text-white font-medium">View All</Text>
            </Pressable>
            <Pressable className="py-2 px-4 bg-primary rounded-md" onPress={() => router.replace("/Dashboard")}>
              <Text className="text-white font-medium">Back</Text>
            </Pressable>
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
        />
      </View>

      <View className="flex-1 px-4">
        <Text className="text-lg font-semibold text-foreground mb-2">Transactions</Text>
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="small" color="#0000ff" />
            <Text className="mt-2 text-muted">Loading transactions...</Text>
          </View>
        ) : !filteredTransactions || filteredTransactions.length === 0 ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-muted">No transactions found</Text>
          </View>
        ) : (
          <TransactionsListComponent transactions={filteredTransactions} onPress={handleTransactionPress} />
        )}
      </View>
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
