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
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyCategoriesTransactions)
    .select()
    .in("type", ["Expense", "Adjustment"])
    .gte("date", startDate ?? dayjs().startOf("month").toISOString())
    .lte("date", endDate ?? dayjs().endOf("month").toISOString());

  if (error) throw new Error(error.message);
  return data;
};
export const getStatsMonthlyAccountsTransactions = async (startDate?: string, endDate?: string) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyAccountsTransactions)
    .select()
    .gte("date", startDate ?? dayjs().startOf("week").toISOString())
    .lte("date", endDate ?? dayjs().endOf("week").toISOString());

  if (error) throw new Error(error.message);
  return data;
};
