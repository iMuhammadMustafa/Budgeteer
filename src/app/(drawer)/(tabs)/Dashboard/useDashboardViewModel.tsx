import { useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { DoubleBarPoint, PieData } from "@/src/types/components/Charts.types";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";

export enum DashboardViewSelectionType {
  CALENDAR = "calendar",
  PIE = "pie",
  BAR = "bar",
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
}

export default function useDashboard() {
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const dateRanges = statsService.useGetDateRanges();

  const { data: dailyTransactionsThisMonth, isLoading: isWeeklyLoading } = statsService.useGetStatsDailyTransactions(
    dateRanges.currentMonth.start,
    dateRanges.currentMonth.end,
    true,
  );
  const { data: monthlyTransactionsGroupsAndCategories = { groups: [], categories: [] }, isLoading: isMonthlyLoading } =
    statsService.useGetStatsMonthlyCategoriesTransactions(dateRanges.currentMonth.start, dateRanges.currentMonth.end);

  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } =
    statsService.useGetStatsMonthlyTransactionsTypes(dateRanges.currentYear.start, dateRanges.currentYear.end);

  const { data: netWorthGrowth = [], isLoading: isNetWorthLoading } = statsService.useGetStatsNetWorthGrowth(
    dateRanges.currentYear.start,
    dateRanges.currentYear.end,
  );

  const params = useLocalSearchParams() as Partial<IDetailsViewProps>;
  const filters = useMemo<TransactionFilters>(() => {
    const baseFilters: TransactionFilters = {};
    if (params.startDate) baseFilters.startDate = params.startDate;
    if (params.endDate) baseFilters.endDate = params.endDate;

    if (params.type === DashboardViewSelectionType.PIE && params.itemId && params.pieType) {
      if (params.pieType === "category") {
        baseFilters.categoryid = params.itemId;
      }
      if (params.pieType === "group") {
        baseFilters.groupid = params.itemId;
      }
    }

    return baseFilters;
  }, [params]);
  const { data: filteredTransactions, isLoading: isFiltersLoading } = transactionService.useFindAllView(filters);

  const dashboardData = useMemo(
    () => ({
      weeklyTransactionTypesData: dailyTransactionsThisMonth?.barsData,
      dailyTransactionTypesData: dailyTransactionsThisMonth?.calendarData,
      monthlyCategories: monthlyTransactionsGroupsAndCategories.categories,
      monthlyGroups: monthlyTransactionsGroupsAndCategories.groups,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    }),
    [
      dailyTransactionsThisMonth,
      monthlyTransactionsGroupsAndCategories,
      yearlyTransactionsTypes,
      netWorthGrowth,
      filteredTransactions,
    ],
  );

  const [isLocalLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isLoading =
    isWeeklyLoading || isMonthlyLoading || isYearlyLoading || isNetWorthLoading || isFiltersLoading || isLocalLoading;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    statsService.useRefreshAllQueries();
    setTimeout(() => setRefreshing(false), 1000);
  }, [statsService]);

  const handleDayPress = useCallback((day: any, type: DashboardViewSelectionType) => {
    const dateString = dayjs(day.dateString).local().format("YYYY-MM-DD");
    const startOfDay = dayjs(day.dateString).utc().startOf("day").toISOString();
    const endOfDay = dayjs(day.dateString).utc().endOf("day").toISOString();

    router.push({
      pathname: "/Dashboard/Details",
      params: {
        type: type,
        date: dateString,
        label: dateString,
        startDate: startOfDay,
        endDate: endOfDay,
      },
    });
  }, []);

  const handlePiePress = useCallback((item: PieData, type: "category" | "group") => {
    const startOfMonth = dayjs().utc().startOf("month").toISOString();
    const endOfMonth = dayjs().utc().endOf("month").toISOString();

    router.push({
      pathname: "/Dashboard/Details",
      params: {
        type: DashboardViewSelectionType.PIE,
        pieType: type,
        itemId: item.id,
        itemLabel: item.x,
        label: `${type === "category" ? "Category" : "Group"}: ${item.x}`,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
    });
  }, []);

  const handleBarPress = useCallback((item: DoubleBarPoint) => {
    const startOfMonth = dayjs(item.x).utc().startOf("month").toISOString();
    const endOfMonth = dayjs(item.x).endOf("month").toISOString();
    router.push({
      pathname: "/Dashboard/Details",
      params: {
        type: "bar",
        month: item.x,
        label: `Month: ${item.x}`,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
    });
  }, []);

  const handleBackToOverview = useCallback(() => {
    router.replace("/Dashboard");
  }, []);

  const handleTransactionPress = useCallback((transaction: any) => {
    if (transaction.id) {
      router.push({
        pathname: "/AddTransaction",
        params: { id: transaction.id },
      });
    }
  }, []);

  const handleViewAllNavigation = useCallback(() => {
    const navigationParams: any = {};
    if (params.type === "calendar") {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
    } else if (params.type === "pie") {
      const key = params.pieType === "category" ? "categoryid" : "groupid";
      navigationParams[key] = params.itemId;
    } else if (params.type === "bar") {
      navigationParams.startDate = params.startDate;
      navigationParams.endDate = params.endDate;
    }

    router.push({
      pathname: "/Transactions",
      params: navigationParams,
    });
  }, [params]);

  return {
    ...dashboardData,
    isLoading,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    handleBackToOverview,
    filters,
    params,
    handleViewAllNavigation,
  };
}
