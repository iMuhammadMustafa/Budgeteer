import dayjs from "dayjs";

import supabase from "@/src/providers/Supabase";
import { EnumNames, ViewNames } from "@/src/types/db/TableNames";
import { TransactionType } from "@/src/types/db/Tables.Types";

export const getStatsDailyTransactions = async (startDate?: string, endDate?: string, type?: TransactionType) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsDailyTransactions)
    .select()
    .eq("type", type ?? "Expense")
    .gte("date", startDate ?? dayjs().startOf("week").toISOString())
    .lte("date", endDate ?? dayjs().endOf("week").toISOString());

  if (error) throw new Error(error.message);
  return data;
};

export const getStatsMonthlyTransactionsTypes = async (startDate?: string, endDate?: string) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyTransactionsTypes)
    .select()
    .gte("date", startDate ?? dayjs().startOf("week").toISOString())
    .lte("date", endDate ?? dayjs().endOf("week").toISOString());

  if (error) throw new Error(error.message);
  return data;
};

export const getStatsMonthlyCategoriesTransactions = async (startDate?: string, endDate?: string) => {
  // Format dates to match database format (first day of month at 00:00:00 UTC)
  const formattedStartDate = startDate 
    ? dayjs(startDate).startOf('month').format('YYYY-MM-DD')
    : dayjs().startOf("month").format('YYYY-MM-DD');
    
  const formattedEndDate = endDate
    ? dayjs(endDate).endOf('month').format('YYYY-MM-DD')
    : dayjs().endOf("month").format('YYYY-MM-DD');
    
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyCategoriesTransactions)
    .select(`
      groupid,
      categoryid,
      groupname,
      categoryname,
      sum,
      type,
      groupicon,
      categoryicon,
      groupbudgetamount,
      categorybudgetamount
    `)
    .in("type", ["Expense", "Adjustment"])
    .gte("date", formattedStartDate)
    .lte("date", formattedEndDate);

  if (error) throw new Error(error.message);
  return data;
};

export const getStatsMonthlyAccountsTransactions = async (startDate?: string, endDate?: string) => {
  // Format dates to match database format (first day of month at 00:00:00 UTC)
  const formattedStartDate = startDate 
    ? dayjs(startDate).startOf('month').format('YYYY-MM-DD')
    : dayjs().startOf("month").format('YYYY-MM-DD');
    
  const formattedEndDate = endDate
    ? dayjs(endDate).endOf('month').format('YYYY-MM-DD')
    : dayjs().endOf("month").format('YYYY-MM-DD');
  
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyAccountsTransactions)
    .select()
    .gte("date", formattedStartDate)
    .lte("date", formattedEndDate);

  if (error) throw new Error(error.message);
  return data;
};
