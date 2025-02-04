// StatsMonthlyAccountsTransactions = "stats_monthlyaccountstransactions",
import dayjs from "dayjs";

import supabase from "@/src/providers/Supabase";
import { ViewNames } from "@/src/types/db/TableNames";

export const getDailyTransactionsSummary = async (startDate?: string, endDate?: string) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsDailyTransactions)
    .select()
    .gte("date", startDate ?? dayjs().startOf("week").toISOString())
    .lte("date", endDate ?? dayjs().endOf("week").toISOString());

  if (error) throw new Error(error.message);
  return data;
};
export const getMonthlyCategoriesTransactions = async (startDate?: string, endDate?: string) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyCategoriesTransactions)
    .select()
    .gte("date", startDate ?? dayjs().startOf("month").toISOString())
    .lte("date", endDate ?? dayjs().endOf("month").toISOString());

  if (error) throw new Error(error.message);
  return data;
};
