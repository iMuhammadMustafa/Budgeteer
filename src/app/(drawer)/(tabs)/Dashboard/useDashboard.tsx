import { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  useGetStatsDailyTransactions,
  useGetStatsMonthlyCategoriesTransactions,
  useGetStatsYearTransactionsTypes,
} from "@/src/services/repositories/Stats.Repository";
import { useGetTransactions } from "@/src/services/repositories/Transactions.Repository";
import supabase from "@/src/providers/Supabase";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import { TransactionsView } from "@/src/types/db/Tables.Types";

dayjs.extend(utc);
dayjs.extend(timezone);

const today = dayjs();

const startOfCurrentMonth = dayjs().startOf("month").format("YYYY-MM-DD");
const endOfCurrentMonth = dayjs().endOf("month").format("YYYY-MM-DD");

const startOfCurrentYear = dayjs().startOf("year").toISOString();
const endOfCurrentYear = dayjs().endOf("year").toISOString();

export default function useDashboard() {
  const { data: dailyTransactionsThisMonth, isLoading: isWeeklyLoading } = useGetStatsDailyTransactions(
    startOfCurrentMonth,
    endOfCurrentMonth,
    true,
  );
  const { data: monthlyTransactionsGroupsAndCategories = [], isLoading: isMonthlyLoading } =
    useGetStatsMonthlyCategoriesTransactions(startOfCurrentMonth, endOfCurrentMonth);
  const { data: yearlyTransactionsTypes = [], isLoading: isYearlyLoading } = useGetStatsYearTransactionsTypes(
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
    return Array.isArray(monthlyTransactionsGroupsAndCategories)
      ? []
      : monthlyTransactionsGroupsAndCategories.categories;
  }, [monthlyTransactionsGroupsAndCategories]);
  const monthlyGroups = useMemo(() => {
    return Array.isArray(monthlyTransactionsGroupsAndCategories) ? [] : monthlyTransactionsGroupsAndCategories.groups;
  }, [monthlyTransactionsGroupsAndCategories]);

  // Function to fetch transactions for a specific date
  const fetchTransactionsForDate = async (date: string): Promise<TransactionsView[]> => {
    try {
      // Convert the date to local timezone for the start and end of the day
      const startOfDay = dayjs(date).startOf('day').toISOString();
      const endOfDay = dayjs(date).endOf('day').toISOString();
      
      const { data, error } = await supabase
        .from('transactionsview')
        .select('*')
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions for date:', error);
      return [];
    }
  };

  // Function to fetch transactions for a specific category or group
  const fetchTransactionsForCategory = async (categoryId: string, type: 'category' | 'group'): Promise<TransactionsView[]> => {
    try {
      // Get the start and end of the current month in local timezone
      const startOfMonth = dayjs().startOf('month').toISOString();
      const endOfMonth = dayjs().endOf('month').toISOString();
      
      const { data, error } = await supabase
        .from('transactionsview')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .eq(type === 'category' ? 'categoryid' : 'groupid', categoryId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions for category:', error);
      return [];
    }
  };

  // Function to fetch transactions for a specific month
  const fetchTransactionsForMonthAndType = async (month: string): Promise<TransactionsView[]> => {
    try {
      // Convert the month to local timezone for the start and end of the month
      const startOfMonth = dayjs(month).startOf('month').toISOString();
      const endOfMonth = dayjs(month).endOf('month').toISOString();
      
      const { data, error } = await supabase
        .from('transactionsview')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions for month:', error);
      return [];
    }
  };

  return {
    weeklyTransactionTypesData,
    dailyTransactionTypesData,
    yearlyTransactionsTypes,
    monthlyCategories,
    monthlyGroups,
    isWeeklyLoading,
    isMonthlyLoading,
    isYearlyLoading,
    fetchTransactionsForDate,
    fetchTransactionsForCategory,
    fetchTransactionsForMonthAndType,
  };
}
