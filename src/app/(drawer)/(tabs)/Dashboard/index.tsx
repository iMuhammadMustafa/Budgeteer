import Button from "@/src/components/elements/Button";
import DashboardCharts from "@/src/components/Charts/DashboardCharts";
import DashboardSkeleton from "@/src/components/Charts/DashboardSkeleton";
import GridPattern from "@/src/components/GridPattern";
import { RefreshCcw } from "lucide-react-native";
import { RefreshControl, ScrollView, View } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";
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

  console.log("DashboardIndex rendered");

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <GridPattern />
      <View className="flex-row items-center justify-between px-4 py-2 bg-background">
        <ThemedText variant="heading" className="text-xl">Dashboard</ThemedText>
        <Button
          variant="ghost"
          size="icon"
          onPress={onRefresh}
          accessibilityLabel="Refresh dashboard"
          testID="btn-refresh-dashboard"
        >
          <RefreshCcw size={24} color="#4CAF50" />
        </Button>
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
