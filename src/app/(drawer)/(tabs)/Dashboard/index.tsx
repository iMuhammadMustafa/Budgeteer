import { SafeAreaView, ScrollView, Text, View } from "react-native";
import useDashboard from "./useDashboard";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import MyPie from "@/src/components/Charts/MyPie";
import MyCalendar from "@/src/components/Charts/MyCalendar";

export default function Dashboard() {
  const {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    isWeeklyLoading,
    isMonthlyLoading,
    isYearlyLoading,
  } = useDashboard();

  if (isWeeklyLoading && isMonthlyLoading && isYearlyLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <ScrollView className="flex-1 h-full">
        <View>
          <Bar data={weeklyTransactionTypesData!} hideY label="Last Week Expenses" />
          <DoubleBar data={yearlyTransactionsTypes} label="Net Earnings" />

          <MyPie data={monthlyCategories} label="Categories" />
          <MyPie data={monthlyGroups} label="Groups" />

          <MyCalendar label="Calendar" data={dailyTransactionTypesData!} onDayPress={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
