import { DashboardViewSelectionType } from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import { View } from "react-native";
import Bar from "./Bar";
import ChartsContainer from "./ChartsContainer";
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
  periodControls,
}: any) {
  if (params) {
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
      case DashboardViewSelectionType.PIE: {
        const isPieCategory = params.pieType === "category";
        return (
          <ChartsContainer
            isPeriodControl
            onPrev={periodControls.month.prev}
            onNext={periodControls.month.next}
            label={periodControls.month.label}
          >
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

  return (
    <View>
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
        />
      </ChartsContainer>
      <ChartsContainer
        isPeriodControl
        onPrev={periodControls.year.prev}
        onNext={periodControls.year.next}
        label={periodControls.year.label}
      >
        <DoubleBar key={periodControls.year.label} data={yearlyTransactionsTypes} label="Net Earnings" onBarPress={handleBarPress} />
      </ChartsContainer>
      <ChartsContainer
        isPeriodControl
        onPrev={periodControls.year.prev}
        onNext={periodControls.year.next}
        label={periodControls.year.label}
      >
        <Line key={periodControls.year.label} data={netWorthGrowth} label="Net Worth Growth" color="rgba(76, 175, 80, 0.6)" />
      </ChartsContainer>
      <ChartsContainer
        isPeriodControl
        onPrev={periodControls.month.prev}
        onNext={periodControls.month.next}
        label={periodControls.month.label}
      >
        <MyPie data={monthlyCategories} label="Categories" onPiePress={item => handlePiePress(item, "category")} />
      </ChartsContainer>

      <ChartsContainer
        isPeriodControl
        onPrev={periodControls.month.prev}
        onNext={periodControls.month.next}
        label={periodControls.month.label}
      >
        <MyPie data={monthlyGroups} label="Groups" onPiePress={item => handlePiePress(item, "group")} />
      </ChartsContainer>
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
          currentDate={periodControls.calendar.currentDate}
        />
      </ChartsContainer>
    </View>
  );
}
