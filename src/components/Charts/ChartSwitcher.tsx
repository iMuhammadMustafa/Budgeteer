import { DashboardViewSelectionType } from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import Bar from "./Bar";
import ChartsContainer from "./ChartsContainer";
import DoubleBar from "./DoubleBar";
import MyCalendar from "./MyCalendar";
import MyPie from "./MyPie";

export default function ChartSwitcher({
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
  periodControls,
}: any) {
  switch (params.type) {
    case DashboardViewSelectionType.CALENDAR:
      return (
        <ChartsContainer
          isPeriodControl
          onPrev={periodControls.calendar.prev}
          onNext={periodControls.calendar.next}
          label={periodControls.calendar.label}
        >
          <MyCalendar
            label="Calendar"
            data={dailyTransactionTypesData!}
            onDayPress={day => handleDayPress(day, DashboardViewSelectionType.CALENDAR)}
            selectedDate={params.date}
            currentDate={periodControls.calendar.currentDate}
          />
        </ChartsContainer>
      );
    case DashboardViewSelectionType.BAR:
      return (
        <ChartsContainer
          isPeriodControl
          onPrev={periodControls.week.prev}
          onNext={periodControls.week.next}
          label={periodControls.week.label}
        >
          <Bar
            data={weeklyTransactionTypesData!}
            hideY
            label="Week's Expenses"
            onDayPress={day => handleDayPress(day, DashboardViewSelectionType.BAR)}
            selectedDate={params.date}
          />
        </ChartsContainer>
      );
    case DashboardViewSelectionType.DOUBLE_BAR:
      return (
        <ChartsContainer
          isPeriodControl
          onPrev={periodControls.earningsYear.prev}
          onNext={periodControls.earningsYear.next}
          label={periodControls.earningsYear.label}
        >
          <DoubleBar
            key={periodControls.earningsYear.label}
            data={yearlyTransactionsTypes}
            label="Net Earnings"
            onBarPress={handleBarPress}
          />
        </ChartsContainer>
      );
    case DashboardViewSelectionType.PIE: {
      const isPieCategory = params.pieType === "category";
      const pieControls = isPieCategory ? periodControls.categoriesMonth : periodControls.groupsMonth;
      return (
        <ChartsContainer isPeriodControl onPrev={pieControls.prev} onNext={pieControls.next} label={pieControls.label}>
          <MyPie
            data={isPieCategory ? monthlyCategories : monthlyGroups}
            label={isPieCategory ? "Categories" : "Groups"}
            onPiePress={item => handlePiePress(item, params.pieType as "category" | "group")}
            highlightedSlice={params.itemLabel}
          />
        </ChartsContainer>
      );
    }
    default:
      return null;
  }
}
