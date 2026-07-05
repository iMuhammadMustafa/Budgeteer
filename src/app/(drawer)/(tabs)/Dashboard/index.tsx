import { RefreshControl, ScrollView } from "react-native";

import DashboardCharts from "@/src/components/dashboard/DashboardCharts";
import DashboardOverview from "@/src/components/dashboard/DashboardOverview";
import DashboardSkeleton from "@/src/components/dashboard/DashboardSkeleton";

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
    calendarSummary,
    selection,
    selectWeekDay,
    selectPieSlice,
    selectEarningsMonth,
    income,
    spending,
    sparkline,
    totalbalance,
    accountsCount,
  } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 custom-scrollbar"
      contentContainerClassName="p-4 gap-4 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <DashboardOverview
        totalBalance={totalbalance}
        accountsCount={accountsCount}
        income={income}
        spending={spending}
        sparkline={sparkline}
        onRefresh={onRefresh}
      />
      <DashboardCharts
        weeklyTransactionTypesData={weeklyTransactionTypesData}
        dailyTransactionTypesData={dailyTransactionTypesData}
        yearlyTransactionsTypes={yearlyTransactionsTypes}
        netWorthGrowth={netWorthGrowth}
        monthlyCategories={monthlyCategories}
        monthlyGroups={monthlyGroups}
        recentTransactions={recentTransactions}
        handleDayPress={handleDayPress}
        handlePiePress={handlePiePress}
        handleBarPress={handleBarPress}
        handleTransactionPress={handleTransactionPress}
        selection={selection}
        onSelectWeekDay={selectWeekDay}
        onSelectPieSlice={selectPieSlice}
        onSelectEarningsMonth={selectEarningsMonth}
        calendarSummary={calendarSummary}
        periodControls={periodControls}
      />
    </ScrollView>
  );
}
