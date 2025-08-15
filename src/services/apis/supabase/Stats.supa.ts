// Real implementation moved from Stats.api.ts
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { EnumNames, ViewNames } from "@/src/types/db/TableNames";
import {
  StatsMonthlyCategoriesTransactions,
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyAccountsTransactions,
  TransactionType,
} from "@/src/types/db/Tables.Types";
import { IStatsProvider } from "@/src/types/storage/providers/IStatsProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseStatsProvider implements IStatsProvider {
  readonly mode: StorageMode = StorageMode.Cloud;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.StatsDailyTransactions)
          .select()
          .eq("tenantid", tenantId)
          .eq("type", type ?? "Expense")
          .gte("date", startDate ?? dayjs().startOf("week").toISOString())
          .lte("date", endDate ?? dayjs().endOf("week").toISOString());

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getStatsDailyTransactions",
            table: "statsdailytransactions",
            tenantId,
            filters: { startDate, endDate, type },
          });
        }

        return data as StatsDailyTransactions[];
      },
      {
        storageMode: "cloud",
        operation: "getStatsDailyTransactions",
        table: "statsdailytransactions",
        tenantId,
      },
    );
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.StatsMonthlyTransactionsTypes)
          .select()
          .eq("tenantid", tenantId)
          .gte("date", startDate ?? dayjs().startOf("week").toISOString())
          .lte("date", endDate ?? dayjs().endOf("week").toISOString());

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getStatsMonthlyTransactionsTypes",
            table: "statsmonthlytransactionstypes",
            tenantId,
            filters: { startDate, endDate },
          });
        }

        return data as StatsMonthlyTransactionsTypes[];
      },
      {
        storageMode: "cloud",
        operation: "getStatsMonthlyTransactionsTypes",
        table: "statsmonthlytransactionstypes",
        tenantId,
      },
    );
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    return withStorageErrorHandling(
      async () => {
        const formattedStartDate = startDate
          ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
          : dayjs().startOf("month").format("YYYY-MM-DD");

        const formattedEndDate = endDate
          ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
          : dayjs().endOf("month").format("YYYY-MM-DD");

        const { data, error } = await supabase
          .from(ViewNames.StatsMonthlyCategoriesTransactions)
          .select("*")
          .eq("tenantid", tenantId)
          .in("type", ["Expense", "Adjustment"])
          .gte("date", formattedStartDate)
          .lte("date", formattedEndDate);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getStatsMonthlyCategoriesTransactions",
            table: "statsmonthlycategoriestransactions",
            tenantId,
            filters: { startDate, endDate },
          });
        }

        return data as StatsMonthlyCategoriesTransactions[];
      },
      {
        storageMode: "cloud",
        operation: "getStatsMonthlyCategoriesTransactions",
        table: "statsmonthlycategoriestransactions",
        tenantId,
      },
    );
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    return withStorageErrorHandling(
      async () => {
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

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getStatsMonthlyAccountsTransactions",
            table: "statsmonthlyaccountstransactions",
            tenantId,
            filters: { startDate, endDate },
          });
        }

        return data as StatsMonthlyAccountsTransactions[];
      },
      {
        storageMode: "cloud",
        operation: "getStatsMonthlyAccountsTransactions",
        table: "statsmonthlyaccountstransactions",
        tenantId,
      },
    );
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(ViewNames.StatsNetWorthGrowth)
          .select("*")
          .eq("tenantid", tenantId)
          .gte("month", startDate ?? dayjs().startOf("year").format("YYYY-MM-DD"))
          .lte("month", endDate ?? dayjs().endOf("year").format("YYYY-MM-DD"))
          .order("month", { ascending: true });

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getStatsNetWorthGrowth",
            table: "statsnetworthgrowth",
            tenantId,
            filters: { startDate, endDate },
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "getStatsNetWorthGrowth",
        table: "statsnetworthgrowth",
        tenantId,
      },
    );
  }
}

// Export provider instance
export const supabaseStatsProvider = new SupabaseStatsProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getStatsDailyTransactions = supabaseStatsProvider.getStatsDailyTransactions.bind(supabaseStatsProvider);
export const getStatsMonthlyTransactionsTypes =
  supabaseStatsProvider.getStatsMonthlyTransactionsTypes.bind(supabaseStatsProvider);
export const getStatsMonthlyCategoriesTransactions =
  supabaseStatsProvider.getStatsMonthlyCategoriesTransactions.bind(supabaseStatsProvider);
export const getStatsMonthlyAccountsTransactions =
  supabaseStatsProvider.getStatsMonthlyAccountsTransactions.bind(supabaseStatsProvider);
export const getStatsNetWorthGrowth = supabaseStatsProvider.getStatsNetWorthGrowth.bind(supabaseStatsProvider);
