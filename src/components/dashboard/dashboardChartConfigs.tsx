/**
 * dashboardChartConfigs — single source of truth for the dashboard's six charts.
 * `useDashboardChartConfigs` returns a typed descriptor list (title, period bar,
 * detail-routing metadata, and the ready-to-render new `ui/charts` node with its
 * data adapted + callbacks wired). `DashboardCharts` maps the whole list. (The drill-down page
 * no longer uses this builder — it renders its one chart directly from `useDetailsViewModel`.)
 *
 * Lives in `components/` (not the Expo Router route dir) so it isn't treated as a route.
 */
import dayjs from "dayjs";

import type { BarDataType, PieData } from "@/src/types/components/Charts.types";
import {
  DashboardChartConfig,
  DashboardChartsProps,
  DashboardViewSelectionType,
} from "@/src/types/pages/dashboard/DashboardConfig.Types";
import { toBarData, toDonutData, toDoubleBar, toHeatmap, toLineData } from "@/src/utils/chartAdapters";
import { BarChart, CalendarHeatmap, DonutChart, DoubleBarChart, LineChart } from "@/src/components/ui";
import type { ThemeColors } from "@/src/components/ui/theme/tokens";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import CalendarSummaryPanel from "./CalendarSummaryPanel";
import RecentTransactions from "./RecentTransactions";

/** The Sunday-based week start inferred from any populated bar, so even empty bars resolve a date. */
function weekStart(bars: BarDataType[] = []) {
  const withDate = bars.find(b => b.item?.date);
  return withDate ? dayjs(withDate.item.date).startOf("week") : null;
}

export function useDashboardChartConfigs(props: DashboardChartsProps, colors: ThemeColors): DashboardChartConfig[] {
  const {
    weeklyTransactionTypesData = [],
    dailyTransactionTypesData = {},
    yearlyTransactionsTypes = [],
    netWorthGrowth = [],
    monthlyCategories = [],
    monthlyGroups = [],
    handleDayPress,
    handlePiePress,
    handleBarPress,
    selection,
    onSelectWeekDay,
    onSelectPieSlice,
    onSelectEarningsMonth,
    params = {},
    periodControls,
  } = props;
  const { formatCurrency } = usePrimaryCurrency();
  const fmtMoney = (n: number) => formatCurrency(n, false);

  const ws = weekStart(weeklyTransactionTypesData);
  // Live tap-selection wins; params.* is the fallback for older item-carrying links.
  const selectedWeekDate = selection?.weekDate ?? params.date ?? null;
  const barSelectedIndex =
    selectedWeekDate && ws
      ? weeklyTransactionTypesData.findIndex((_, i) => ws.add(i, "day").format("YYYY-MM-DD") === selectedWeekDate)
      : -1;
  const selectedMonth = selection?.earningsMonth ?? params.month ?? null;
  const doubleBarSelectedIndex = selectedMonth ? yearlyTransactionsTypes.findIndex(d => d.x === selectedMonth) : -1;

  const earnings = toDoubleBar(yearlyTransactionsTypes);

  const donut = (data: PieData[], type: "category" | "group") => (
    <DonutChart
      data={toDonutData(data)}
      formatValue={fmtMoney}
      externalLabels
      fillHeight
      legendPosition="bottom"
      legendMaxHeight={120}
      selectedLabel={(type === "category" ? selection?.category : selection?.group)?.x ?? null}
      onSlicePress={d => {
        if (d.label === "Other") {
          onSelectPieSlice?.(type, null);
          return;
        }
        onSelectPieSlice?.(type, data.find(p => p.x === d.label) ?? null);
      }}
      onSliceLongPress={d => {
        if (d.label === "Other") return;
        const orig = data.find(p => p.x === d.label);
        if (orig) handlePiePress(orig, type);
      }}
      emptyTitle="No data"
      centerLabel="Spent"
      centerValue={fmtMoney(data.reduce((s, d) => s + d.y, 0))}
    />
  );

  // Row order (2-col): Week's Expenses | Calendar · Categories | Groups · Net Worth Growth | Net Earnings.
  return [
    {
      key: "week",
      order: 1,
      detailType: DashboardViewSelectionType.BAR,
      title: "Week's Expenses",
      period: periodControls.week.chartCardPeriod,
      loading: periodControls.week.loading,
      onDetails: periodControls.week.onDetails,
      node: (
        <BarChart
          data={toBarData(weeklyTransactionTypesData)}
          showYAxis={false}
          fillHeight
          selectedIndex={barSelectedIndex >= 0 ? barSelectedIndex : null}
          onBarPress={(_d, i) => {
            if (ws) onSelectWeekDay?.(ws.add(i, "day").format("YYYY-MM-DD"));
          }}
          onBarLongPress={(_d, i) => {
            if (!ws) return;
            handleDayPress({ dateString: ws.add(i, "day").format("YYYY-MM-DD") }, DashboardViewSelectionType.BAR);
          }}
          emptyTitle="No expenses this week"
          showValues
          formatValue={fmtMoney}
        />
      ),
    },
    {
      key: "calendar-summary",
      order: 2,
      title: "Calendar Summary",
      detailType: DashboardViewSelectionType.CALENDAR_SUMMARY,
      period: periodControls.calendarSummary.chartCardPeriod,
      loading: periodControls.calendarSummary.loading,
      node: (
        <CalendarSummaryPanel
          summary={props.calendarSummary!}
          fmtMoney={fmtMoney}
          onDayPress={ds => props.handleDayPress({ dateString: ds }, DashboardViewSelectionType.CALENDAR)}
        />
      ),
    },
    {
      key: "categoriesMonth",
      order: 3,
      detailType: DashboardViewSelectionType.PIE,
      pieType: "category",
      title: "Categories",
      period: periodControls.categoriesMonth.chartCardPeriod,
      loading: periodControls.categoriesMonth.loading,
      onDetails: periodControls.categoriesMonth.onDetails,
      node: donut(monthlyCategories, "category"),
    },
    {
      key: "groupsMonth",
      order: 4,
      detailType: DashboardViewSelectionType.PIE,
      pieType: "group",
      title: "Groups",
      period: periodControls.groupsMonth.chartCardPeriod,
      loading: periodControls.groupsMonth.loading,
      onDetails: periodControls.groupsMonth.onDetails,
      node: donut(monthlyGroups, "group"),
    },
    {
      key: "netWorthYear",
      order: 5,
      detailType: DashboardViewSelectionType.PIE, // net worth has no dedicated detail view; not routed to
      title: "Net Worth Growth",
      period: periodControls.netWorthYear.chartCardPeriod,
      loading: periodControls.netWorthYear.loading,
      node: (
        <LineChart
          data={toLineData(netWorthGrowth)}
          color={colors.income}
          formatValue={fmtMoney}
          emptyTitle="No net worth data"
          fillHeight
          showLegend
        />
      ),
    },
    {
      key: "earningsYear",
      order: 6,
      detailType: DashboardViewSelectionType.DOUBLE_BAR,
      title: "Net Earnings",
      period: periodControls.earningsYear.chartCardPeriod,
      loading: periodControls.earningsYear.loading,
      onDetails: periodControls.earningsYear.onDetails,
      node: (
        <DoubleBarChart
          data={earnings.data}
          bar1Label={earnings.bar1Label}
          bar2Label={earnings.bar2Label}
          bar1Color={earnings.bar1Color}
          bar2Color={earnings.bar2Color}
          fillHeight
          selectedIndex={doubleBarSelectedIndex >= 0 ? doubleBarSelectedIndex : null}
          onBarPress={(_d, i) => {
            const point = yearlyTransactionsTypes[i];
            if (point) onSelectEarningsMonth?.(point.x);
          }}
          onBarLongPress={(_d, i) => {
            const point = yearlyTransactionsTypes[i];
            if (point) handleBarPress(point);
          }}
          emptyTitle="No earnings data"
          showValues
          formatValue={n => fmtMoney(n).slice(0, -3)}
        />
      ),
    },
    {
      key: "calendar",
      order: 7,
      detailType: DashboardViewSelectionType.CALENDAR,
      title: "Calendar",
      loading: periodControls.calendar.loading,
      // No period bar — the calendar's own arrows/swipe are the single nav, wired to the data cursor.
      node: (
        <CalendarHeatmap
          markedDates={toHeatmap(dailyTransactionTypesData)}
          currentDate={periodControls.calendar.currentDate}
          selectedDate={params.date ?? null}
          onDayPress={ds => handleDayPress({ dateString: ds }, DashboardViewSelectionType.CALENDAR)}
          onMonthChange={ds => {
            const cur = dayjs(periodControls.calendar.currentDate);
            const next = dayjs(ds);
            if (next.isAfter(cur, "month")) periodControls.calendar.chartCardPeriod.onNext();
            else if (next.isBefore(cur, "month")) periodControls.calendar.chartCardPeriod.onPrev();
          }}
        />
      ),
    },
    {
      key: "recent-transactions",
      order: 8,
      bodyHeight: "auto",
      detailType: DashboardViewSelectionType.RECENT_TRANSACTION,
      title: "Recent Transactions",
      node: <RecentTransactions transactions={props.recentTransactions ?? []} onPress={props.handleTransactionPress} />,
    },
  ];
}
