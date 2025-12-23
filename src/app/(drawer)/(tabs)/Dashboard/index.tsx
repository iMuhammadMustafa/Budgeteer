import DashboardCharts from "@/src/components/Charts/DashboardCharts";
import { RefreshCcw } from "lucide-react-native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useDashboard from "./useDashboardViewModel";

export default function DashboardIndex() {
  const {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    netWorthGrowth,
    isLoading,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    periodControls,
  } = useDashboard();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-4 text-foreground">Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <View className="flex-row items-center justify-between px-4 py-2 bg-background">
        <Text className="text-xl font-bold text-foreground">Dashboard</Text>
        <Pressable className="p-2">
          <RefreshCcw size={24} color="#4CAF50" onPress={onRefresh} />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1 h-full"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
            title="Pull to refresh"
            titleColor="#4CAF50"
          />
        }
      >
        <DashboardCharts
          weeklyTransactionTypesData={weeklyTransactionTypesData}
          dailyTransactionTypesData={dailyTransactionTypesData}
          yearlyTransactionsTypes={yearlyTransactionsTypes}
          netWorthGrowth={netWorthGrowth}
          monthlyCategories={monthlyCategories}
          monthlyGroups={monthlyGroups}
          handleDayPress={handleDayPress}
          handlePiePress={handlePiePress}
          handleBarPress={handleBarPress}
          periodControls={periodControls}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
