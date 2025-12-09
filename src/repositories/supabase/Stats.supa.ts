// Real implementation moved from Stats.api.ts
import supabase from "@/src/providers/Supabase";
import { ViewNames } from "@/src/types/database/TableNames";
import {
  StatsDailyTransactions,
  StatsMonthlyAccountsTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/database/Tables.Types";
import dayjs from "dayjs";
import { IStatsRepository } from "../interfaces/IStatsRepository";

export class StatsSupaRepository implements IStatsRepository {
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

    if (error) throw error;
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

    if (error) throw error;
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
      .select()
      .eq("tenantid", tenantId)
      .in("type", ["Expense", "Adjustment"])
      .gte("date", formattedStartDate)
      .lte("date", formattedEndDate);

    if (error) throw error;
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

    if (error) throw error;
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

    if (error) throw error;
    return data;
  }
}
