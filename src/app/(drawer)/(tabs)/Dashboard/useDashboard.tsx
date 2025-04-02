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
  const fetchTransactionsForDate = async (dateString: string): Promise<TransactionsView[]> => {
    try {
      const startOfDay = dayjs(dateString).startOf('day').toISOString();
      const endOfDay = dayjs(dateString).endOf('day').toISOString();
      
      const { data, error } = await supabase
        .from(ViewNames.TransactionsView)
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
  const fetchTransactionsForCategory = async (name: string, type: 'category' | 'group'): Promise<TransactionsView[]> => {
    try {
      const { data, error } = await supabase
        .from(ViewNames.TransactionsView)
        .select('*')
        .eq(type === 'category' ? 'categoryname' : 'groupname', name)
        .gte('date', startOfCurrentMonth)
        .lte('date', endOfCurrentMonth)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching transactions for ${type}:`, error);
      return [];
    }
  };

  // Function to fetch transactions for a specific month
  const fetchTransactionsForMonthAndType = async (monthName: string): Promise<TransactionsView[]> => {
    try {
      // Convert month name to month number (e.g., "Jan" -> 0)
      const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(monthName);
      if (monthIndex === -1) {
        throw new Error(`Invalid month name: ${monthName}`);
      }
      
      const year = dayjs().year();
      
      const startOfMonth = dayjs().year(year).month(monthIndex).startOf('month').toISOString();
      const endOfMonth = dayjs().year(year).month(monthIndex).endOf('month').toISOString();
      
      const { data, error } = await supabase
        .from(ViewNames.TransactionsView)
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
