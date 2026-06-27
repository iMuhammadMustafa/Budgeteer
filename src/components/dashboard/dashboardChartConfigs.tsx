/**
 * dashboardChartConfigs — single source of truth for the dashboard's six charts.
 * `buildDashboardChartConfigs` returns a typed descriptor list (title, period bar,
 * detail-routing metadata, and the ready-to-render new `ui/charts` node with its
 * data adapted + callbacks wired). `DashboardCharts` maps the whole list;
 * `ChartSwitcher` picks the one descriptor matching the drill-down `params`.
 *
 * Lives in `components/` (not the Expo Router route dir) so it isn't treated as a route.
 */
import { type ReactNode } from "react";

import {
  DashboardViewSelectionType,
  type IDetailsViewProps,
} from "@/src/app/(drawer)/(tabs)/Dashboard/useDashboardViewModel";
import type { ChartCardPeriod } from "@/src/components/ui";
import { BarChart, CalendarHeatmap, DonutChart, DoubleBarChart, LineChart } from "@/src/components/ui";
import type { ThemeColors } from "@/src/components/ui/theme/tokens";
import type {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
import { toBarData, toDonutData, toDoubleBar, toHeatmap, toLineData } from "@/src/utils/chartAdapters";
import dayjs from "dayjs";

interface PeriodControl {
  label: string;
  prev: () => void;
  next: () => void;
  currentDate?: string;
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
    params = {},
    periodControls,
  } = props;

  const ws = weekStart(weeklyTransactionTypesData);
  const barSelectedIndex =
    params.date && ws
      ? weeklyTransactionTypesData.findIndex((_, i) => ws.add(i, "day").format("YYYY-MM-DD") === params.date)
      : -1;
  const doubleBarSelectedIndex = params.month ? yearlyTransactionsTypes.findIndex(d => d.x === params.month) : -1;

  const earnings = toDoubleBar(yearlyTransactionsTypes);

  const donut = (data: PieData[], type: "category" | "group") => (
    <DonutChart
      data={toDonutData(data)}
      formatValue={fmtMoney}
      externalLabels
      legendPosition="bottom"
      onSlicePress={d => {
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
      node: (
        <BarChart
          data={toBarData(weeklyTransactionTypesData)}
          showYAxis={false}
          selectedIndex={barSelectedIndex >= 0 ? barSelectedIndex : null}
          onBarPress={(_d, i) => {
            if (!ws) return;
            handleDayPress({ dateString: ws.add(i, "day").format("YYYY-MM-DD") }, DashboardViewSelectionType.BAR);
          }}
          emptyTitle="No expenses this week"
        />
      ),
    },
    {
      key: "calendar",
      detailType: DashboardViewSelectionType.CALENDAR,
      title: "Calendar",
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
      node: donut(monthlyCategories, "category"),
    },
    {
      key: "groupsMonth",
      detailType: DashboardViewSelectionType.PIE,
      pieType: "group",
      title: "Groups",
      period: period(periodControls.groupsMonth),
      node: donut(monthlyGroups, "group"),
    },
    {
      key: "netWorthYear",
      detailType: DashboardViewSelectionType.PIE, // net worth has no dedicated detail view; not routed to
      title: "Net Worth Growth",
      period: period(periodControls.netWorthYear),
      node: (
        <LineChart
          data={toLineData(netWorthGrowth)}
          color={colors.income}
          formatValue={fmtMoney}
          emptyTitle="No net worth data"
        />
      ),
    },
    {
      key: "earningsYear",
      detailType: DashboardViewSelectionType.DOUBLE_BAR,
      title: "Net Earnings",
      period: period(periodControls.earningsYear),
      node: (
        <DoubleBarChart
          data={earnings.data}
          bar1Label={earnings.bar1Label}
          bar2Label={earnings.bar2Label}
          bar1Color={earnings.bar1Color}
          bar2Color={earnings.bar2Color}
          selectedIndex={doubleBarSelectedIndex >= 0 ? doubleBarSelectedIndex : null}
          onBarPress={(_d, i) => {
            const point = yearlyTransactionsTypes[i];
            if (point) handleBarPress(point);
          }}
          emptyTitle="No earnings data"
        />
      ),
    },
  ];
}
