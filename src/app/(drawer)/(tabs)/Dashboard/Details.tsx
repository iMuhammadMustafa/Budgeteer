/**
 * DetailView — the chart drill-down page. Driven purely by route params via useDetailsViewModel:
 * one context chart for the drilled type + a day-grouped transaction list, with a toggle between
 * the focused item ("Groceries") and the whole period ("All · May 2026").
 */
import { useCallback } from "react";
import { FlatList, Pressable, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BarChart,
  Button,
  CalendarHeatmap,
  ChartCard,
  DonutChart,
  DoubleBarChart,
  SkeletonGroup,
  Text,
} from "@/src/components/ui";
import DayHeader from "@/src/components/Transactions/DayHeader";
import DaySkeleton from "@/src/components/Transactions/DaySkeleton";
import EmptyListComponent from "@/src/components/Transactions/EmptyListComponent";
import TransactionItem from "@/src/components/Transactions/TransactionItem";
import { CONTENT_MAX_WIDTH } from "@/src/constants/layout";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { toBarData, toDonutData, toDoubleBar, toHeatmap } from "@/src/utils/chartAdapters";
import { TransactionListRow } from "@/src/types/components/Transactions.types";
import { cn } from "@/src/components/ui/utils/cn";
import { DashboardViewSelectionType } from "./useDashboardViewModel";
import useDetailsViewModel from "./useDetailsViewModel";

export default function DetailView() {
  const {
    type,
    title,
    scope,
    setScope,
    periodLabel,
    itemLabel,
    weeklyBars,
    calendarData,
    pieData,
    yearlyTypes,
    barSelectedIndex,
    doubleSelectedIndex,
    pieSelectedLabel,
    selectedDate,
    calendarCurrent,
    onCalendarMonthChange,
    selectPie,
    selectDay,
    selectMonth,
    rows,
    isLoading,
    handleTransactionPress,
    handleBack,
    handleViewAll,
  } = useDetailsViewModel();

  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const { width } = useWindowDimensions();
  // Matches DonutChart's own "beside" breakpoint: on a wide details page the legend sits next to
  // the ring and gets vertical room to scroll; on a narrow one it drops below with a shorter cap.
  const wideDonut = width >= 600;
  const fmtMoney = useCallback((n: number) => formatCurrency(n, false), [formatCurrency]);

  const renderItem = useCallback(
    ({ item }: { item: TransactionListRow }) =>
      item.kind === "header" ? (
        <DayHeader day={item.day} amount={item.amount} />
      ) : (
        <TransactionItem
          transaction={item.transaction}
          transferTransaction={item.transferTransaction}
          isSelected={false}
          onPress={handleTransactionPress}
          onLongPress={() => {}}
        />
      ),
    [handleTransactionPress],
  );

  const chartNode = (() => {
    switch (type) {
      case DashboardViewSelectionType.BAR:
        return (
          <BarChart
            data={toBarData(weeklyBars)}
            showYAxis={false}
            fillHeight
            showValues
            formatValue={fmtMoney}
            selectedIndex={barSelectedIndex ?? null}
            onBarPress={(_d, i) => {
              const date = weeklyBars?.[i]?.item?.date;
              if (date) selectDay(date);
            }}
            emptyTitle="No expenses this week"
          />
        );
      case DashboardViewSelectionType.CALENDAR:
        return (
          <CalendarHeatmap
            markedDates={toHeatmap(calendarData)}
            currentDate={calendarCurrent}
            selectedDate={selectedDate}
            onDayPress={selectDay}
            onMonthChange={onCalendarMonthChange}
          />
        );
      case DashboardViewSelectionType.PIE: {
        const total = (pieData ?? []).reduce((s, d) => s + d.y, 0);
        return (
          <DonutChart
            data={toDonutData(pieData)}
            formatValue={fmtMoney}
            externalLabels
            fillHeight
            legendPosition="auto"
            legendMaxHeight={wideDonut ? 260 : 120}
            selectedLabel={pieSelectedLabel}
            centerLabel="Spent"
            centerValue={fmtMoney(total)}
            emptyTitle="No data"
            onSlicePress={d => {
              if (d.label !== "Other") selectPie(d.label);
            }}
          />
        );
      }
      case DashboardViewSelectionType.DOUBLE_BAR: {
        const earnings = toDoubleBar(yearlyTypes);
        return (
          <DoubleBarChart
            data={earnings.data}
            bar1Label={earnings.bar1Label}
            bar2Label={earnings.bar2Label}
            bar1Color={earnings.bar1Color}
            bar2Color={earnings.bar2Color}
            fillHeight
            showValues
            formatValue={n => fmtMoney(n).slice(0, -3)}
            selectedIndex={doubleSelectedIndex ?? null}
            onBarPress={(_d, i) => {
              const month = yearlyTypes[i]?.x;
              if (month) selectMonth(month);
            }}
            emptyTitle="No earnings data"
          />
        );
      }
      default:
        return null;
    }
  })();

  const header = (
    <View className="gap-3 pt-2">
      <View className="flex-row items-center justify-between">
        <Button
          variant="ghost"
          leadingIcon="ArrowLeft"
          className="px-2 py-0"
          iconSize={22}
          label={title}
          size="lg"
          onPress={handleBack}
        />
        <Button variant="primary" size="sm" label="View All" onPress={handleViewAll} />
      </View>

      {chartNode ? (
        <ChartCard
          title={periodLabel}
          bodyHeight={type === DashboardViewSelectionType.CALENDAR ? "auto" : undefined}
          className="my-0"
          testID="details-chart"
        >
          {chartNode}
        </ChartCard>
      ) : null}

      {/* Scope toggle — shown whenever something is selected, whether it arrived from the drill
          or was tap-selected here, so the two entry paths behave identically. */}
      {itemLabel ? (
        <View className="flex-row gap-2">
          <ScopeChip active={scope === "focused"} label={itemLabel} onPress={() => setScope("focused")} />
          <ScopeChip active={scope === "period"} label={`All · ${periodLabel}`} onPress={() => setScope("period")} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* One always-mounted FlatList: only the LIST body swaps to skeletons while the transaction
            query refetches. The header (and its context chart) stays mounted across that refetch, so
            re-picking a slice no longer unmounts/remounts — and re-animates — the chart. */}
        <FlatList
          className="flex-1"
          data={isLoading ? [] : rows}
          keyExtractor={row => row.key}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isLoading ? <SkeletonGroup count={5} renderRow={() => <DaySkeleton />} /> : <EmptyListComponent />
          }
          contentContainerStyle={[
            { width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center", paddingHorizontal: 16 },
            isLoading || rows.length === 0 ? { flexGrow: 1 } : null,
          ]}
          windowSize={11}
          maxToRenderPerBatch={12}
          initialNumToRender={12}
        />
      </View>
    </SafeAreaView>
  );
}

function ScopeChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full border px-3.5 py-1.5 active:opacity-70",
        active ? "border-primary bg-primary" : "border-border bg-surface",
      )}
      testID={`details-scope-${active ? "active" : "inactive"}`}
    >
      <Text variant="label" className={cn(active ? "text-white" : "text-ink-mute")} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
