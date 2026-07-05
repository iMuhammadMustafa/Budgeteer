/**
 * dashboardChartConfigs — single source of truth for the dashboard's six charts.
 * `buildDashboardChartConfigs` returns a typed descriptor list (title, period bar,
 * detail-routing metadata, and the ready-to-render new `ui/charts` node with its
 * data adapted + callbacks wired). `DashboardCharts` maps the whole list. (The drill-down page
 * no longer uses this builder — it renders its one chart directly from `useDetailsViewModel`.)
 *
 * Lives in `components/` (not the Expo Router route dir) so it isn't treated as a route.
 */
import { type ReactNode } from "react";
import dayjs from "dayjs";

import type {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
import { toBarData, toDonutData, toDoubleBar, toHeatmap, toLineData } from "@/src/utils/chartAdapters";
import type { ChartCardPeriod } from "@/src/components/ui";
import { BarChart, CalendarHeatmap, DonutChart, DoubleBarChart, LineChart } from "@/src/components/ui";
import type { ThemeColors } from "@/src/components/ui/theme/tokens";
import {
  DashboardViewSelectionType,
  type IDetailsViewProps,
} from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";

interface PeriodControl {
  label: string;
  prev: () => void;
  next: () => void;
  currentDate?: string;
  /** This chart's query is refetching (e.g. after a period change) — drives the card's skeleton. */
  loading?: boolean;
  /** Drill into this chart's whole-period details (the ChartCard "Details" link). */
  onDetails?: () => void;
}

export interface DashboardChartsProps {
  weeklyTransactionTypesData?: BarDataType[];
  dailyTransactionTypesData?: MyCalendarData;
  yearlyTransactionsTypes?: DoubleBarPoint[];
  netWorthGrowth?: LineChartPoint[];
  monthlyCategories?: PieData[];
  monthlyGroups?: PieData[];
  handleDayPress: (day: { dateString: string }, type: DashboardViewSelectionType) => void;
  handlePiePress: (item: PieData, type: "category" | "group") => void;
  handleBarPress: (item: DoubleBarPoint, barKey?: "barOne" | "barTwo") => void;
  /** Tap-to-select highlight state (lifted to the dashboard so the Details link can carry it). */
  selection?: {
    weekDate: string | null;
    category: PieData | null;
    group: PieData | null;
    earningsMonth: string | null;
  };
  onSelectWeekDay?: (date: string) => void;
  onSelectPieSlice?: (type: "category" | "group", item: PieData | null) => void;
  onSelectEarningsMonth?: (month: string) => void;
  /** Month-at-a-glance data for the panel beside the wide-screen calendar. */
  calendarSummary?: {
    income: number;
    expense: number;
    net: number;
    activeDays: number;
    topDays: { date: string; amount: number }[];
  };
  params?: Partial<IDetailsViewProps>;
  periodControls: {
    week: PeriodControl;
    earningsYear: PeriodControl;
    netWorthYear: PeriodControl;
    categoriesMonth: PeriodControl;
    groupsMonth: PeriodControl;
    calendar: PeriodControl;
  };
}

export interface DashboardChartConfig {
  key: string;
  detailType: DashboardViewSelectionType;
  pieType?: "category" | "group";
  title: string;
  /** Period bar shown in the ChartCard; omitted for charts that own their own nav (e.g. calendar). */
  period?: ChartCardPeriod;
  /** This chart's data is refetching — surfaces the card's body skeleton. */
  loading?: boolean;
  /** Drill into the whole-period details (the ChartCard "Details" link); omitted for non-drillable charts. */
  onDetails?: () => void;
  node: ReactNode;
}

const period = (p: PeriodControl): ChartCardPeriod => ({ label: p.label, onPrev: p.prev, onNext: p.next });

/** The Sunday-based week start inferred from any populated bar, so even empty bars resolve a date. */
function weekStart(bars: BarDataType[] = []) {
  const withDate = bars.find(b => b.item?.date);
  return withDate ? dayjs(withDate.item.date).startOf("week") : null;
}

export function buildDashboardChartConfigs(
  props: DashboardChartsProps,
  colors: ThemeColors,
  fmtMoney: (n: number) => string,
  /** Run the charts' entry (grow/draw-on) animations. Callers pass `false` after
   *  first mount so a period change re-renders data without replaying animations. */
  animated: boolean = true,
): DashboardChartConfig[] {
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
      animated={animated}
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
      detailType: DashboardViewSelectionType.BAR,
      title: "Week's Expenses",
      period: period(periodControls.week),
      loading: periodControls.week.loading,
      onDetails: periodControls.week.onDetails,
      node: (
        <BarChart
          animated={animated}
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
      key: "calendar",
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
            if (next.isAfter(cur, "month")) periodControls.calendar.next();
            else if (next.isBefore(cur, "month")) periodControls.calendar.prev();
          }}
        />
      ),
    },
    {
      key: "categoriesMonth",
      detailType: DashboardViewSelectionType.PIE,
      pieType: "category",
      title: "Categories",
      period: period(periodControls.categoriesMonth),
      loading: periodControls.categoriesMonth.loading,
      onDetails: periodControls.categoriesMonth.onDetails,
      node: donut(monthlyCategories, "category"),
    },
    {
      key: "groupsMonth",
      detailType: DashboardViewSelectionType.PIE,
      pieType: "group",
      title: "Groups",
      period: period(periodControls.groupsMonth),
      loading: periodControls.groupsMonth.loading,
      onDetails: periodControls.groupsMonth.onDetails,
      node: donut(monthlyGroups, "group"),
    },
    {
      key: "netWorthYear",
      detailType: DashboardViewSelectionType.PIE, // net worth has no dedicated detail view; not routed to
      title: "Net Worth Growth",
      period: period(periodControls.netWorthYear),
      loading: periodControls.netWorthYear.loading,
      node: (
        <LineChart
          animated={animated}
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
      detailType: DashboardViewSelectionType.DOUBLE_BAR,
      title: "Net Earnings",
      period: period(periodControls.earningsYear),
      loading: periodControls.earningsYear.loading,
      onDetails: periodControls.earningsYear.onDetails,
      node: (
        <DoubleBarChart
          animated={animated}
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
  ];
}
