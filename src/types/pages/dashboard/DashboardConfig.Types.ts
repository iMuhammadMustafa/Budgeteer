import { ReactNode } from "react";

import { ChartCardPeriod } from "@/src/components/ui";
import { CalendarSummary, CalendarSummaryPanelProps } from "@/src/components/dashboard/CalendarSummaryPanel";

import { BarDataType, DoubleBarPoint, LineChartPoint, MyCalendarData, PieData } from "../../components/Charts.types";
import { TransactionsView } from "../../database/Tables.Types";

export enum DashboardViewSelectionType {
  CALENDAR = "calendar",
  PIE = "pie",
  BAR = "bar",
  DOUBLE_BAR = "double_bar",
  RECENT_TRANSACTION = "recent_transaction",
  CALENDAR_SUMMARY = "calendar_summary",
}

export interface IDetailsViewProps {
  type: DashboardViewSelectionType;
  date?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
  pieType?: "category" | "group";
  itemId?: string;
  itemLabel?: string;
  month?: string;
  transactionType?: string;
  /** The chart's whole-period window (week/month/year), independent of the focused item's window.
   * Lets the details page toggle between the focused item and "All · <period>". */
  periodStart?: string;
  periodEnd?: string;
}

export type PeriodRange = { start: string; end: string };

export interface PeriodControl {
  chartCardPeriod: ChartCardPeriod;
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
  recentTransactions?: TransactionsView[];
  handleDayPress: (day: { dateString: string }, type: DashboardViewSelectionType) => void;
  handlePiePress: (item: PieData, type: "category" | "group") => void;
  handleBarPress: (item: DoubleBarPoint, barKey?: "barOne" | "barTwo") => void;
  handleTransactionPress: (transaction: TransactionsView) => void;
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
  calendarSummary?: CalendarSummary;
  params?: Partial<IDetailsViewProps>;
  periodControls: {
    week: PeriodControl;
    earningsYear: PeriodControl;
    netWorthYear: PeriodControl;
    categoriesMonth: PeriodControl;
    groupsMonth: PeriodControl;
    calendar: PeriodControl;
    calendarSummary: PeriodControl;
  };
}

export interface DashboardChartConfig {
  key: string;
  order?: number;
  detailType: DashboardViewSelectionType;
  pieType?: "category" | "group";
  title: string;
  /** Period bar shown in the ChartCard; omitted for charts that own their own nav (e.g. calendar). */
  period?: ChartCardPeriod;
  /** This chart's data is refetching — surfaces the card's body skeleton. */
  loading?: boolean;
  /** Drill into the whole-period details (the ChartCard "Details" link); omitted for non-drillable charts. */
  onDetails?: () => void;
  /** Custom body height, or "auto" to size to content instead of the fixed default. */
  bodyHeight?: number | "auto";
  node: ReactNode;
}
