/**
 * useDetailsViewModel — the chart drill-down page's own view model, driven ENTIRELY by the
 * route `params` (no period cursors). A details page only ever shows ONE chart + a filtered
 * transaction list, so this fetches just that chart's data plus the transactions — unlike the
 * dashboard view model, whose six queries and separate cursors used to desync the details title
 * from its data and make the double-bar page hang on unrelated queries.
 *
 * Selection: `scope` toggles between the drilled item ("focused") and the whole period
 * ("period"). It defaults to "focused" when the drill carried an item, else "period". Tapping the
 * chart re-picks the focused item.
 */
import { useCallback, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";

import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TransactionType, TransactionsView } from "@/src/types/database/Tables.Types";
import { getStatsDailyTransactionsHelper, useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { groupTransactions } from "@/src/utils/transactions.helper";
import { TransactionListRow } from "@/src/types/components/Transactions.types";
import { DashboardViewSelectionType, type IDetailsViewProps } from "./useDashboardViewModel";

export type DetailsScope = "focused" | "period";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function useDetailsViewModel() {
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const params = useLocalSearchParams() as Partial<IDetailsViewProps>;
  const type = params.type;

  // Windows — params only. Focused item window = startDate/endDate; whole-period window =
  // periodStart/periodEnd (falls back to the focused window for older links without one).
  const periodStart = params.periodStart ?? params.startDate;
  const periodEnd = params.periodEnd ?? params.endDate;

  const isPie = type === DashboardViewSelectionType.PIE;
  const isDouble = type === DashboardViewSelectionType.DOUBLE_BAR;
  const isBar = type === DashboardViewSelectionType.BAR;
  const isCalendar = type === DashboardViewSelectionType.CALENDAR;
  const isDayish = isBar || isCalendar;

  // Whether the drill carried a focused item (a slice / a day / a month).
  const paramItem = isPie ? params.itemId : isDayish ? params.date : isDouble ? params.month : undefined;
  const hasParamItem = !!paramItem;

  // Local selection, seeded from params so a re-pick (chart tap) can override the drilled item.
  const [sel, setSel] = useState<{ pieId?: string; pieLabel?: string; date?: string; monthIndex?: number }>(() => ({
    pieId: isPie ? params.itemId : undefined,
    pieLabel: isPie ? params.itemLabel : undefined,
    date: isDayish ? params.date : undefined,
    monthIndex: isDouble && params.month ? MONTHS.indexOf(params.month) : undefined,
  }));
  const [scope, setScope] = useState<DetailsScope>(hasParamItem ? "focused" : "period");
  const focused = scope === "focused";

  // ---- chart-for-context data (only the one chart this page shows) ----
  const { data: dailyRaw = [] } = statsService.useGetStatsDailyTransactionsRaw(
    periodStart ?? "",
    periodEnd ?? "",
    undefined,
    isDayish && !!periodStart,
  );
  const { data: monthlyCats = { categories: [], groups: [] } } = statsService.useGetStatsMonthlyCategoriesTransactions(
    periodStart,
    periodEnd,
    isPie,
  );
  const { data: yearlyTypes = [] } = statsService.useGetStatsMonthlyTransactionsTypes(periodStart, periodEnd, isDouble);

  const weeklyBars = useMemo(
    () => (isBar ? getStatsDailyTransactionsHelper(dailyRaw, true, sel.date ?? periodStart).barsData : undefined),
    [isBar, dailyRaw, sel.date, periodStart],
  );
  const calendarData = useMemo(
    () => (isCalendar ? getStatsDailyTransactionsHelper(dailyRaw, false).calendarData : undefined),
    [isCalendar, dailyRaw],
  );
  const pieData = useMemo(
    () => (isPie ? (params.pieType === "group" ? monthlyCats.groups : monthlyCats.categories) : undefined),
    [isPie, params.pieType, monthlyCats],
  );

  // Selected index for the charts that can express it (donut stays uncontrolled — it sorts/folds
  // slices internally, so a stable index is unreliable; it highlights on tap instead).
  const barSelectedIndex = useMemo(() => {
    if (!isBar || !sel.date || !periodStart) return undefined;
    const i = dayjs(sel.date).diff(dayjs(periodStart).startOf("week"), "day");
    return i >= 0 && i < 7 ? i : undefined;
  }, [isBar, sel.date, periodStart]);
  const doubleSelectedIndex = useMemo(() => {
    if (!isDouble || sel.monthIndex == null) return undefined;
    const i = yearlyTypes.findIndex(d => MONTHS.indexOf(d.x) === sel.monthIndex);
    return i >= 0 ? i : undefined;
  }, [isDouble, sel.monthIndex, yearlyTypes]);

  // ---- transaction filters (period window + optional focus) ----
  const filters = useMemo<TransactionFilters>(() => {
    const f: TransactionFilters = {};
    const dayWindow = (d?: string) => {
      f.startDate = dayjs(d).utc().startOf("day").toISOString();
      f.endDate = dayjs(d).utc().endOf("day").toISOString();
    };

    if (isPie) {
      f.startDate = dayjs(periodStart).utc().startOf("day").toISOString();
      f.endDate = dayjs(periodEnd).utc().endOf("day").toISOString();
      if (focused && sel.pieId) {
        if (params.pieType === "group") f.groupid = sel.pieId;
        else f.categoryid = sel.pieId;
      }
    } else if (isDayish) {
      if (focused && sel.date) {
        dayWindow(sel.date);
      } else {
        f.startDate = dayjs(periodStart).utc().startOf("day").toISOString();
        f.endDate = dayjs(periodEnd).utc().endOf("day").toISOString();
      }
    } else if (isDouble) {
      if (focused && sel.monthIndex != null && periodStart) {
        const m = dayjs(periodStart).utc().month(sel.monthIndex).startOf("month");
        f.startDate = m.toISOString();
        f.endDate = m.endOf("month").toISOString();
        // Keep the drilled income/expense sub-filter only while it still matches the drilled month.
        if (params.transactionType && sel.monthIndex === MONTHS.indexOf(params.month ?? "")) {
          f.type = params.transactionType as TransactionType;
        }
      } else {
        f.startDate = periodStart;
        f.endDate = periodEnd;
      }
    } else {
      f.startDate = params.startDate;
      f.endDate = params.endDate;
    }
    return f;
  }, [isPie, isDayish, isDouble, focused, sel, periodStart, periodEnd, params.pieType, params.transactionType, params.month, params.startDate, params.endDate]);

  const { data: transactions, isLoading } = transactionService.useFindAllView(filters);

  const rows = useMemo<TransactionListRow[]>(() => {
    const list = transactions ?? [];
    const byId = new Map<string, (typeof list)[number]>();
    for (const t of list) if (t.id) byId.set(t.id, t);
    const grouped = groupTransactions(list);
    const out: TransactionListRow[] = [];
    for (const day of Object.keys(grouped)) {
      out.push({ kind: "header", key: `d:${day}`, day, amount: grouped[day].amount });
      for (const t of grouped[day].transactions) {
        const transferTransaction = t.transferid ? byId.get(t.transferid) : undefined;
        if (t.type === "Transfer" && (t.amount ?? 0) > 0 && transferTransaction) continue;
        out.push({ kind: "transaction", key: `t:${t.id}`, transaction: t, transferTransaction });
      }
    }
    return out;
  }, [transactions]);

  // ---- labels ----
  // Format in UTC to match the .utc() period boundaries — this is what fixes the off-by-one
  // month (local formatting of a UTC-midnight boundary could render the previous month).
  const periodLabel = useMemo(() => {
    if (isDouble) return dayjs(periodStart).utc().format("YYYY");
    if (isBar) {
      const s = dayjs(periodStart).utc();
      return `Week of ${s.format("MMM D")}`;
    }
    return dayjs(periodStart).utc().format("MMM YYYY");
  }, [isDouble, isBar, periodStart]);

  const itemLabel = useMemo(() => {
    if (isPie) return sel.pieLabel ?? params.itemLabel;
    if (isDayish && sel.date) return dayjs(sel.date).utc().format("ddd, MMM D");
    if (isDouble && sel.monthIndex != null) return MONTHS[sel.monthIndex];
    return undefined;
  }, [isPie, isDayish, isDouble, sel, params.itemLabel]);

  // ---- re-pick handlers (chart tap) ----
  const selectPie = useCallback(
    (label: string) => {
      const orig = (pieData ?? []).find(p => p.x === label);
      if (!orig) return;
      setSel(s => ({ ...s, pieId: (orig as any).id, pieLabel: orig.x }));
      setScope("focused");
    },
    [pieData],
  );
  const selectDay = useCallback((date: string) => {
    setSel(s => ({ ...s, date }));
    setScope("focused");
  }, []);
  const selectMonth = useCallback((monthLabel: string) => {
    const idx = MONTHS.indexOf(monthLabel);
    if (idx < 0) return;
    setSel(s => ({ ...s, monthIndex: idx }));
    setScope("focused");
  }, []);

  const handleTransactionPress = useCallback((transaction: TransactionsView) => {
    if (transaction.id) router.push({ pathname: "/AddTransaction", params: { id: transaction.id } });
  }, []);

  const handleBack = useCallback(() => {
    // A real stack pop (not replace) so the dashboard reappears with its scroll intact — browser
    // back behaves the same. router.back falls through to /Dashboard if there's no stack entry.
    if (router.canGoBack()) router.back();
    else router.replace("/Dashboard");
  }, []);

  const handleViewAll = useCallback(() => {
    const navigationParams: Record<string, string | undefined> = {};
    if (isPie) {
      const key = params.pieType === "group" ? "groupid" : "categoryid";
      if (focused && sel.pieId) navigationParams[key] = sel.pieId;
      navigationParams.startDate = filters.startDate;
      navigationParams.endDate = filters.endDate;
    } else {
      navigationParams.startDate = filters.startDate;
      navigationParams.endDate = filters.endDate;
      if (filters.type) navigationParams.type = filters.type;
    }
    router.push({ pathname: "/Transactions", params: navigationParams });
  }, [isPie, params.pieType, focused, sel.pieId, filters]);

  return {
    type,
    title: params.label ?? "Details",
    hasItem: hasParamItem,
    scope,
    setScope,
    periodLabel,
    itemLabel,
    pieType: params.pieType,
    // chart data + selection
    weeklyBars,
    calendarData,
    pieData,
    yearlyTypes,
    barSelectedIndex,
    doubleSelectedIndex,
    selectedDate: sel.date ?? null,
    selectPie,
    selectDay,
    selectMonth,
    // list
    rows,
    isLoading,
    handleTransactionPress,
    handleBack,
    handleViewAll,
  };
}
