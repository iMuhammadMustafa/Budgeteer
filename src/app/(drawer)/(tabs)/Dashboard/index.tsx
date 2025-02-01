import { View, ScrollView, SafeAreaView, ActivityIndicator, LogBox } from "react-native";
import Bar from "@/src/components/Charts/Bar";
import DoubleBar from "@/src/components/Charts/DoubleBar";
import useDashboard from "./useDashboard";
import MyPie from "@/src/components/Charts/MyPie";
import React from "react";
import MyCalendar from "@/src/components/Charts/MyCalendar";
import dayjs from "dayjs";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const {
    isLoading,
    lastWeekExpense,
    monthlyNetEarnings,
    groupsExpensesThisMonth,
    categoriesExpensesThisMonth,
    thisMonthsTransactionsCalendarObject,
  } = useDashboard();

  const router = useRouter();

  const handleDayClick = (day: any) => {
    const date = dayjs(day.dateString);
    router.push(`/Transactions?startDate=${date.startOf("day").toISOString()}&endDate=${date.endOf("day")}`);
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <SafeAreaView className="w-full h-full m-auto flex-1">
      <ScrollView className="flex-1 h-full">
        <View>
          <Bar data={lastWeekExpense} hideY label="Last Week Expenses" />
          <DoubleBar data={monthlyNetEarnings} label="Net Earnings" />

          <MyPie data={categoriesExpensesThisMonth} label="Categories" />
          <MyPie data={groupsExpensesThisMonth} label="Groups" />

          <MyCalendar label="Calendar" data={thisMonthsTransactionsCalendarObject} onDayPress={handleDayClick} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
