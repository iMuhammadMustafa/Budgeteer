import { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TransactionsView } from "@/src/types/db/Tables.Types";
import { useStatsService } from "@/src/services/Stats.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { useAuth } from "@/src/providers/AuthProvider";

dayjs.extend(utc);
dayjs.extend(timezone);

const today = dayjs();

const startOfCurrentMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const endOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");

const startOfCurrentYear = dayjs().startOf("year").toISOString();
const endOfCurrentYear = dayjs().endOf("year").toISOString();

export default function useDashboard() {
  const statsService = useStatsService();
  const transactionService = useTransactionService();
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;

  const { data: dailyTransactionsThisMonth, isLoading: isWeeklyLoading } = statsService.getStatsDailyTransactions(
    startOfCurrentMonth,
    endOfCurrentMonth,
    true,
  );
  const { data: monthlyTransactionsGroupsAndCategories = { groups: [], categories: [] }, isLoading: isMonthlyLoading } =
    statsService.getStatsMonthlyCategoriesTransactions(startOfCurrentMonth, endOfCurrentMonth);
  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } =
    statsService.getStatsMonthlyTransactionsTypes(startOfCurrentYear, endOfCurrentYear);

  const { data: netWorthGrowth = [], isLoading: isNetWorthLoading } = statsService.getStatsNetWorthGrowth(
    startOfCurrentYear,
    endOfCurrentYear,
  );

  const weeklyTransactionTypesData = useMemo(() => {
    return dailyTransactionsThisMonth?.barsData;
  }, [dailyTransactionsThisMonth]);

  const dailyTransactionTypesData = useMemo(() => {
    return dailyTransactionsThisMonth?.calendarData;
  }, [dailyTransactionsThisMonth]);

  const monthlyCategories = useMemo(() => {
    return monthlyTransactionsGroupsAndCategories.categories;
  }, [monthlyTransactionsGroupsAndCategories]);

  const monthlyGroups = useMemo(() => {
    return monthlyTransactionsGroupsAndCategories.groups;
  }, [monthlyTransactionsGroupsAndCategories]);

  // Helper functions to fetch data directly from repository
  const fetchTransactionsForDate = async (date: string): Promise<TransactionsView[]> => {
    try {
      if (!tenantId) throw new Error("Tenant ID not found");
      return await transactionService.repo.findByDate(date, tenantId);
    } catch (error) {
      console.error("Error fetching transactions for date:", error);
      return [];
    }
  };

  const fetchTransactionsForCategory = async (
    categoryId: string,
    type: "category" | "group",
  ): Promise<TransactionsView[]> => {
    try {
      if (!tenantId) throw new Error("Tenant ID not found");
      return await transactionService.repo.findByCategory(categoryId, type, tenantId);
    } catch (error) {
      console.error("Error fetching transactions for category:", error);
      return [];
    }
  };

  const fetchTransactionsForMonthAndType = async (month: string): Promise<TransactionsView[]> => {
    try {
      if (!tenantId) throw new Error("Tenant ID not found");
      return await transactionService.repo.findByMonth(month, tenantId);
    } catch (error) {
      console.error("Error fetching transactions for month:", error);
      return [];
    }
  };

  return {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    netWorthGrowth,
    isWeeklyLoading,
    isMonthlyLoading,
    isYearlyLoading,
    isNetWorthLoading,
    fetchTransactionsForDate,
    fetchTransactionsForCategory,
    fetchTransactionsForMonthAndType,
  };
}
