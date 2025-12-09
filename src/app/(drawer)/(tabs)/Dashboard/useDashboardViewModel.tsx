import { useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { DoubleBarPoint, PieData } from "@/src/types/components/Charts.types";
import { TransactionsView } from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

type SelectionType = "calendar" | "pie" | "bar";

type SelectionState = {
  type: SelectionType | null;
  data: any;
  transactions: TransactionsView[];
  isLoading: boolean;
};

export default function useDashboard() {
  const statsService = useStatsService();
  const transactionService = useTransactionService();

  const dateRanges = statsService.useGetDateRanges();

  const [selection, setSelection] = useState<SelectionState>({
    type: null,
    data: null,
    transactions: [],
    isLoading: false,
  });
  const [refreshing, setRefreshing] = useState(false);

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

  const dashboardData = useMemo(
    () => ({
      weeklyTransactionTypesData: dailyTransactionsThisMonth?.barsData,
      dailyTransactionTypesData: dailyTransactionsThisMonth?.calendarData,
      monthlyCategories: monthlyTransactionsGroupsAndCategories.categories,
      monthlyGroups: monthlyTransactionsGroupsAndCategories.groups,
      yearlyTransactionsTypes,
      netWorthGrowth,
    }),
    [dailyTransactionsThisMonth, monthlyTransactionsGroupsAndCategories, yearlyTransactionsTypes, netWorthGrowth],
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(isWeeklyLoading || isMonthlyLoading || isYearlyLoading || isNetWorthLoading);
  }, [isWeeklyLoading, isMonthlyLoading, isYearlyLoading, isNetWorthLoading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    statsService.useRefreshAllQueries();
    setTimeout(() => setRefreshing(false), 1000);
  }, [statsService]);

  const handleDayPress = async (day: any) => {
    try {
      const localDate = dayjs(day.dateString).local();
      const dateString = localDate.format("YYYY-MM-DD");

      setSelection({
        type: "calendar",
        data: { date: dateString, label: localDate.format("MMM D, YYYY") },
        transactions: [],
        isLoading: true,
      });

      const startOfDay = dayjs(day.dateString).utc().startOf("day").toISOString();
      const endOfDay = dayjs(day.dateString).utc().endOf("day").toISOString();
      const { data, isLoading: isTransactionsLoading } = await transactionService.useFindAllView({
        startDate: startOfDay,
        endDate: endOfDay,
      });
      setIsLoading(isTransactionsLoading);

      setSelection(prev => ({
        ...prev,
        transactions: data ?? [],
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching transactions for date:", error);
      setSelection(prev => ({ ...prev, transactions: [], isLoading: false }));
    }
  };

  const handlePiePress = async (item: PieData, type: "category" | "group") => {
    try {
      setSelection({
        type: "pie",
        data: { item, type, label: `${type === "category" ? "Category" : "Group"}: ${item.x}` },
        transactions: [],
        isLoading: true,
      });

      const startOfMonth = dayjs().utc().startOf("month").toISOString();
      const endOfMonth = dayjs().utc().endOf("month").toISOString();
      let filters: TransactionFilters = { startDate: startOfMonth, endDate: endOfMonth };
      if (type === "category") {
        filters.categoryid = item.id;
      } else {
        filters.groupid = item.id;
      }
      const { data: transactions, isLoading: isTransactionLoading } = await transactionService.useFindAllView(filters);

      setIsLoading(isTransactionLoading);

      setSelection(prev => ({ ...prev, transactions: transactions ?? [], isLoading: false }));
    } catch (error) {
      console.error("Error fetching transactions for category:", error);
      setSelection(prev => ({ ...prev, transactions: [], isLoading: false }));
    }
  };

  const handleBarPress = async (item: DoubleBarPoint) => {
    try {
      setSelection({
        type: "bar",
        data: { item, label: `Month: ${item.x}` },
        transactions: [],
        isLoading: true,
      });

      const startOfMonth = dayjs(item.x).utc().startOf("month").toISOString();
      const endOfMonth = dayjs(item.x).endOf("month").toISOString();
      const { data: transactions, isLoading: isTransactionLoading } = await transactionService.useFindAllView({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });

      setIsLoading(isTransactionLoading);

      setSelection(prev => ({ ...prev, transactions: transactions ?? [], isLoading: false }));
    } catch (error) {
      console.error("Error fetching transactions for month:", error);
      setSelection(prev => ({ ...prev, transactions: [], isLoading: false }));
    }
  };

  const handleBackToOverview = () => {
    setSelection({ type: null, data: null, transactions: [], isLoading: false });
  };

  const handleTransactionPress = (transaction: any) => {
    if (transaction.id) {
      router.push({
        pathname: "/AddTransaction",
        params: { id: transaction.id },
      });
    }
  };

  return {
    ...dashboardData,
    isLoading,
    selection,
    refreshing,
    onRefresh,
    handleDayPress,
    handlePiePress,
    handleBarPress,
    handleTransactionPress,
    handleBackToOverview,
  };
}
