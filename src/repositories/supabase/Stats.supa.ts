// Real implementation moved from Stats.api.ts
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { EnumNames, ViewNames } from "@/src/types/db/TableNames";
import {
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyAccountsTransactions,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/db/Tables.Types";
import { IStatsRepository } from "../interfaces/IStatsRepository";

export class StatsRepository implements IStatsRepository {
  async getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]> {
    const { data, error } = await supabase
      .from(ViewNames.StatsDailyTransactions)
      .select()
      .eq("tenantid", tenantId)
      .eq("type", type ?? "Expense")
      .gte("date", startDate ?? dayjs().startOf("week").toISOString())
      .lte("date", endDate ?? dayjs().endOf("week").toISOString());

    if (error) throw new Error(error.message);
    return data;
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    const { data, error } = await supabase
      .from(ViewNames.StatsMonthlyTransactionsTypes)
      .select()
      .eq("tenantid", tenantId)
      .gte("date", startDate ?? dayjs().startOf("week").toISOString())
      .lte("date", endDate ?? dayjs().endOf("week").toISOString());

    if (error) throw new Error(error.message);
    return data;
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
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
      .eq("tenantid", tenantId)
      .in("type", ["Expense", "Adjustment"])
      .gte("date", formattedStartDate)
      .lte("date", formattedEndDate);

    if (error) throw new Error(error.message);
    return data as StatsMonthlyCategoriesTransactions[];
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    const formattedStartDate = startDate
      ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
      : dayjs().startOf("month").format("YYYY-MM-DD");

    const formattedEndDate = endDate
      ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
      : dayjs().endOf("month").format("YYYY-MM-DD");

    const { data, error } = await supabase
      .from(ViewNames.StatsMonthlyAccountsTransactions)
      .select()
      .eq("tenantid", tenantId)
      .gte("date", formattedStartDate)
      .lte("date", formattedEndDate);

    if (error) throw new Error(error.message);
    return data;
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<StatsNetWorthGrowth[]> {
    const { data, error } = await supabase
      .from(ViewNames.StatsNetWorthGrowth)
      .select("*")
      .eq("tenantid", tenantId)
      .gte("month", startDate ?? dayjs().startOf("year").format("YYYY-MM-DD"))
      .lte("month", endDate ?? dayjs().endOf("year").format("YYYY-MM-DD"))
      .order("month", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }
}

// Legacy functions for backward compatibility (can be removed after migration)
export const getStatsDailyTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
) => {
  const repository = new StatsRepository();
  return repository.getStatsDailyTransactions(tenantId, startDate, endDate, type);
};

export const getStatsMonthlyTransactionsTypes = async (tenantId: string, startDate?: string, endDate?: string) => {
  const repository = new StatsRepository();
  return repository.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
};

export const getStatsMonthlyCategoriesTransactions = async (
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<StatsMonthlyCategoriesTransactions[]> => {
  const repository = new StatsRepository();
  return repository.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
};

export const getStatsMonthlyAccountsTransactions = async (tenantId: string, startDate?: string, endDate?: string) => {
  const repository = new StatsRepository();
  return repository.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
};

export const getStatsNetWorthGrowth = async (tenantId: string, startDate?: string, endDate?: string) => {
  const repository = new StatsRepository();
  return repository.getStatsNetWorthGrowth(tenantId, startDate, endDate);
};
