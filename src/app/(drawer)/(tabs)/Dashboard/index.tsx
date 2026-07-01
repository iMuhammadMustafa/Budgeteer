import { useAccountService } from "@/src/services/Accounts.Service";
import dayjs from "dayjs";
import { useMemo } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DashboardCharts from "@/src/components/dashboard/DashboardCharts";
import DashboardOverview from "@/src/components/dashboard/DashboardOverview";
import RecentTransactions from "@/src/components/dashboard/RecentTransactions";
import DashboardSkeleton from "@/src/components/Charts/DashboardSkeleton";
import useDashboard from "./useDashboardViewModel";

export default function DashboardIndex() {
  const {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    netWorthGrowth,
    recentTransactions,
    isLoading,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    periodControls,
  } = useDashboard();

  const accountService = useAccountService();
  const { data: totalBalanceData } = accountService.useGetTotalAccountsBalance();
  const { data: accounts } = accountService.useFindAllWithCategory();

  const { income, spending, sparkline } = useMemo(() => {
    const thisMonth = (yearlyTransactionsTypes ?? []).find(d => d.x === dayjs().format("MMM"));
    return {
      income: Math.abs(thisMonth?.barOne.value ?? 0),
      spending: Math.abs(thisMonth?.barTwo.value ?? 0),
      sparkline: (netWorthGrowth ?? []).map(p => p.y).slice(-9),
    };
  }, [yearlyTransactionsTypes, netWorthGrowth]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 w-full self-center"
        contentContainerStyle={{ maxWidth: 1180 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <DashboardOverview
          totalBalance={totalBalanceData?.totalbalance ?? 0}
          accountsCount={accounts?.length ?? 0}
          income={income}
          spending={spending}
          sparkline={sparkline}
          onRefresh={onRefresh}
        />
        <View className="flex-row flex-wrap gap-4">
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
        </View>
        <RecentTransactions transactions={recentTransactions} onPress={handleTransactionPress} />
      </ScrollView>
    </SafeAreaView>
  );
}
