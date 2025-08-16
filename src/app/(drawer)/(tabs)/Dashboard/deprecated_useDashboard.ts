import { useState } from "react";
import dayjs from "dayjs";
import {
  useGetNetWorthGrowthLastYear,
  useGetStatsDailyTransactions,
  useGetStatsMonthlyCategoriesTransactionsForDashboard,
  useGetStatsYearTransactionsTypes,
} from "@/src/services//Stats.Service";
import { TransactionsView } from "@/src/types/db/Tables.Types";
import supabase from "@/src/providers/Supabase";
import { ViewNames, TableNames } from "@/src/types/db/TableNames";

export default function useDashboard() {
  const [currentMonthStartDate] = useState(dayjs().startOf("month").toISOString());
  const [currentMonthEndDate] = useState(dayjs().endOf("month").toISOString());
  const [currentYearStartDate] = useState(dayjs().startOf("year").toISOString());
  const [currentYearEndDate] = useState(dayjs().endOf("year").toISOString());
  const [lastWeekStartDate] = useState(dayjs().subtract(1, "week").startOf("week").toISOString());
  const [lastWeekEndDate] = useState(dayjs().subtract(1, "week").endOf("week").toISOString());

  const { data: weeklyTransactionTypesData, isLoading: isWeeklyLoading } = useGetStatsDailyTransactions(
    lastWeekStartDate,
    lastWeekEndDate,
    true,
  );

  const { data: dailyTransactionTypesData, isLoading: isDailyLoading } = useGetStatsDailyTransactions(
    currentYearStartDate,
    currentYearEndDate,
  );

  const { data: yearlyTransactionsTypes, isLoading: isYearlyLoading } = useGetStatsYearTransactionsTypes(
    currentYearStartDate,
    currentYearEndDate,
  );

  const { data: monthlyCategoriesData, isLoading: isMonthlyCategoriesLoading } =
    useGetStatsMonthlyCategoriesTransactionsForDashboard(currentMonthStartDate, currentMonthEndDate);

  // New hook for net worth growth
  const { data: netWorthGrowthData, isLoading: isNetWorthLoading } = useGetNetWorthGrowthLastYear();

  const fetchTransactionsForDate = async (date: string): Promise<TransactionsView[]> => {
    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select("*")
      .eq("date", date)
      .order("createdat", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const fetchTransactionsForCategory = async (id: string, type: "category" | "group"): Promise<TransactionsView[]> => {
    const filterColumn = type === "category" ? "categoryid" : "groupid";
    // We need to join with transactioncategories or transactiongroups to get the name for display
    // For simplicity, directly querying TransactionsView assuming categoryid/groupid is sufficient for filtering.
    // A more robust solution might involve a dedicated RPC or a more complex query if names are needed here.

    // For now, let's assume we are fetching from TransactionsView and it has categoryid.
    // If groupid is needed, the view or table structure might need adjustment or a different approach.
    // The current StatsMonthlyCategoriesTransactions view has groupid and categoryid.
    // We'll assume the ID passed is the category ID for now.

    let query = supabase
      .from(ViewNames.TransactionsView)
      .select(
        `
        *,
        category:transactioncategories(name, group:transactiongroups(name, icon))
      `,
      )
      .eq(filterColumn, id)
      .gte("date", currentMonthStartDate) // Assuming we want transactions for the current month for that category/group
      .lte("date", currentMonthEndDate)
      .order("date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transactions for category/group:", error);
      throw error;
    }

    // Transform data to match TransactionsView structure if necessary, especially for group name/icon
    const transformedData = data?.map(t => ({
      ...t,
      // @ts-ignore
      groupname: t.category?.group?.name,
      // @ts-ignore
      groupicon: t.category?.group?.icon,
      // @ts-ignore
      categoryname: t.category?.name,
    })) as TransactionsView[];

    return transformedData || [];
  };

  const fetchTransactionsForMonthAndType = async (month: string): Promise<TransactionsView[]> => {
    // month is in "MMM" format, e.g., "Jan"
    // Correctly parse the month string to a number.
    const monthNumber = dayjs(month, "MMM").month(); // Parses "Jan" to 0, "Feb" to 1, etc.
    const year = dayjs().year(); // Assuming current year

    const startDate = dayjs().year(year).month(monthNumber).startOf("month").toISOString();
    const endDate = dayjs().year(year).month(monthNumber).endOf("month").toISOString();

    const { data, error } = await supabase
      .from(ViewNames.TransactionsView)
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return {
    weeklyTransactionTypesData: weeklyTransactionTypesData?.barsData,
    dailyTransactionTypesData: dailyTransactionTypesData?.calendarData,
    yearlyTransactionsTypes,
    monthlyCategories: monthlyCategoriesData?.categories || [],
    monthlyGroups: monthlyCategoriesData?.groups || [],
    isWeeklyLoading,
    isMonthlyLoading: isMonthlyCategoriesLoading || isDailyLoading, // Combine relevant loading states
    isYearlyLoading,
    netWorthGrowthData, // Expose net worth data
    isNetWorthLoading, // Expose net worth loading state
    fetchTransactionsForDate,
    fetchTransactionsForCategory,
    fetchTransactionsForMonthAndType,
  };
}
