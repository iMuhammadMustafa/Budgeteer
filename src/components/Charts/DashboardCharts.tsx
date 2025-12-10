import { DashboardViewSelectionType } from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import { View } from "react-native";
import Bar from "./Bar";
import DoubleBar from "./DoubleBar";
import Line from "./Line";
import MyCalendar from "./MyCalendar";
import MyPie from "./MyPie";

export default function DashboardCharts({
  weeklyTransactionTypesData,
  dailyTransactionTypesData,
  yearlyTransactionsTypes,
  netWorthGrowth,
  monthlyCategories,
  monthlyGroups,
  handleDayPress,
  handlePiePress,
  handleBarPress,
  params,
}: any) {
  if (params) {
    switch (params.type) {
      case DashboardViewSelectionType.CALENDAR:
        return (
          <MyCalendar
            label="Calendar"
            data={dailyTransactionTypesData!}
            onDayPress={day => handleDayPress(day, DashboardViewSelectionType.CALENDAR)}
            selectedDate={params.date}
          />
        );
      case DashboardViewSelectionType.BAR:
        return (
          <Bar
            data={weeklyTransactionTypesData!}
            hideY
            label="Week's Expenses"
            onDayPress={day => handleDayPress(day, DashboardViewSelectionType.BAR)}
            selectedDate={params.date}
          />
        );
      case DashboardViewSelectionType.PIE: {
        const isPieCategory = params.pieType === "category";
        return (
          <MyPie
            data={isPieCategory ? monthlyCategories : monthlyGroups}
            label={isPieCategory ? "Categories" : "Groups"}
            onPiePress={item => handlePiePress(item, params.pieType as "category" | "group")}
            highlightedSlice={params.itemLabel}
          />
        );
      }
      default:
        return null;
    }
  }

  return (
    <View>
      <Bar
        data={weeklyTransactionTypesData!}
        hideY
        label="Week's Expenses"
        onDayPress={day => handleDayPress(day, DashboardViewSelectionType.BAR)}
      />
      <DoubleBar data={yearlyTransactionsTypes} label="Net Earnings" onBarPress={handleBarPress} />
      <Line data={netWorthGrowth} label="Net Worth Growth" color="rgba(76, 175, 80, 0.6)" />
      <MyPie data={monthlyCategories} label="Categories" onPiePress={item => handlePiePress(item, "category")} />
      <MyPie data={monthlyGroups} label="Groups" onPiePress={item => handlePiePress(item, "group")} />
      <MyCalendar
        label="Calendar"
        data={dailyTransactionTypesData!}
        onDayPress={day => handleDayPress(day, DashboardViewSelectionType.CALENDAR)}
      />
    </View>
  );
}
