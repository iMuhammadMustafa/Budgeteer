import dayjs from "dayjs";

import supabase from "@/src/providers/Supabase";
import { EnumNames, ViewNames } from "@/src/types/db/TableNames";
import { StatsMonthlyCategoriesTransactions, TransactionType } from "@/src/types/db/Tables.Types";

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

export const getStatsMonthlyCategoriesTransactions = async (
  startDate?: string,
  endDate?: string,
): Promise<StatsMonthlyCategoriesTransactions[]> => {
  // Format dates to match database format (first day of month at 00:00:00 UTC)
  const formattedStartDate = startDate
    ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
    : dayjs().startOf("month").format("YYYY-MM-DD");

  const formattedEndDate = endDate
    ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
    : dayjs().endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyCategoriesTransactions)
    .select(
      `
      groupid,
      categoryid,
      groupname,
      categoryname,
      sum,
      type,
      groupicon,
      categoryicon,
      groupbudgetamount,
      categorybudgetamount,
      date,
      categorybudgetamount,
      categorybudgetfrequency,
      categorycolor,
      categorydisplayorder,
      categoryicon,
      groupbudgetfrequency,
      groupcolor,
      groupdisplayorder
    `,
    )
    .in("type", ["Expense", "Adjustment"])
    .gte("date", formattedStartDate)
    .lte("date", formattedEndDate);

  if (error) throw new Error(error.message);
  return data;
};

export const getStatsMonthlyAccountsTransactions = async (startDate?: string, endDate?: string) => {
  // Format dates to match database format (first day of month at 00:00:00 UTC)
  const formattedStartDate = startDate
    ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
    : dayjs().startOf("month").format("YYYY-MM-DD");

  const formattedEndDate = endDate
    ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
    : dayjs().endOf("month").format("YYYY-MM-DD");

  const { data, error } = await supabase
    .from(ViewNames.StatsMonthlyAccountsTransactions)
    .select()
    .gte("date", formattedStartDate)
    .lte("date", formattedEndDate);

  if (error) throw new Error(error.message);
  return data;
};

export const getStatsNetWorthGrowth = async (startDate?: string, endDate?: string) => {
  const { data, error } = await supabase
    .from(ViewNames.StatsNetWorthGrowth)
    .select("*")
    .gte("month", startDate ?? dayjs().startOf("year").format("YYYY-MM-DD"))
    .lte("month", endDate ?? dayjs().endOf("year").format("YYYY-MM-DD"))
    .order("month", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};
