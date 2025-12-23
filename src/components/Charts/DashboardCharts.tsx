import { DashboardViewSelectionType } from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import Button from "@/src/components/elements/Button";
import { Text, View } from "react-native";
import Bar from "./Bar";
import DoubleBar from "./DoubleBar";
import Line from "./Line";
import MyCalendar from "./MyCalendar";
import MyPie from "./MyPie";

function PeriodControls({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View className="flex-row items-center justify-between mt-2 bg-card/30 rounded-lg px-3 py-2">
      <Button leftIcon="ChevronLeft" variant="ghost" size="sm" onPress={onPrev} className="px-2" />
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Button rightIcon="ChevronRight" variant="ghost" size="sm" onPress={onNext} className="px-2" />
    </View>
  );
}

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
          <View>
            <MyCalendar
              label="Calendar"
              data={dailyTransactionTypesData!}
              onDayPress={day => handleDayPress(day, DashboardViewSelectionType.CALENDAR)}
              selectedDate={params.date}
            />
            {periodControls?.calendar && (
              <PeriodControls
                label={periodControls.calendar.label}
                onPrev={periodControls.calendar.prev}
                onNext={periodControls.calendar.next}
              />
            )}
          </View>
        );
      case DashboardViewSelectionType.BAR:
        return (
          <View>
            <Bar
              data={weeklyTransactionTypesData!}
              hideY
              label="Week's Expenses"
              onDayPress={day => handleDayPress(day, DashboardViewSelectionType.BAR)}
              selectedDate={params.date}
            />
            {periodControls?.week && (
              <PeriodControls
                label={periodControls.week.label}
                onPrev={periodControls.week.prev}
                onNext={periodControls.week.next}
              />
            )}
          </View>
        );
      case DashboardViewSelectionType.PIE: {
        const isPieCategory = params.pieType === "category";
        return (
          <View>
            <MyPie
              data={isPieCategory ? monthlyCategories : monthlyGroups}
              label={isPieCategory ? "Categories" : "Groups"}
              onPiePress={item => handlePiePress(item, params.pieType as "category" | "group")}
              highlightedSlice={params.itemLabel}
            />
            {periodControls?.month && (
              <PeriodControls
                label={periodControls.month.label}
                onPrev={periodControls.month.prev}
                onNext={periodControls.month.next}
              />
            )}
          </View>
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
      {periodControls?.week && (
        <PeriodControls
          label={periodControls.week.label}
          onPrev={periodControls.week.prev}
          onNext={periodControls.week.next}
        />
      )}

      <DoubleBar data={yearlyTransactionsTypes} label="Net Earnings" onBarPress={handleBarPress} />
      {periodControls?.year && (
        <PeriodControls
          label={periodControls.year.label}
          onPrev={periodControls.year.prev}
          onNext={periodControls.year.next}
        />
      )}

      <Line data={netWorthGrowth} label="Net Worth Growth" color="rgba(76, 175, 80, 0.6)" />
      {periodControls?.year && (
        <PeriodControls
          label={periodControls.year.label}
          onPrev={periodControls.year.prev}
          onNext={periodControls.year.next}
        />
      )}

      <MyPie data={monthlyCategories} label="Categories" onPiePress={item => handlePiePress(item, "category")} />
      {periodControls?.month && (
        <PeriodControls
          label={periodControls.month.label}
          onPrev={periodControls.month.prev}
          onNext={periodControls.month.next}
        />
      )}

      <MyPie data={monthlyGroups} label="Groups" onPiePress={item => handlePiePress(item, "group")} />
      {periodControls?.month && (
        <PeriodControls
          label={periodControls.month.label}
          onPrev={periodControls.month.prev}
          onNext={periodControls.month.next}
        />
      )}

      <MyCalendar
        label="Calendar"
        data={dailyTransactionTypesData!}
        onDayPress={day => handleDayPress(day, DashboardViewSelectionType.CALENDAR)}
      />
      {periodControls?.calendar && (
        <PeriodControls
          label={periodControls.calendar.label}
          onPrev={periodControls.calendar.prev}
          onNext={periodControls.calendar.next}
        />
      )}
    </View>
  );
}
