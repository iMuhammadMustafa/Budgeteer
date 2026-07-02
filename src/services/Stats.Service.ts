import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
import { ViewNames } from "@/src/types/database/TableNames";
import {
  StatsDailyTransactions,
  StatsMonthlyAccountsTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/database/Tables.Types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  getStatsDailyTransactionsHelper,
  getStatsMonthlyCategoriesTransactionsDashboardHelper,
  getStatsMonthlyTransactionsTypesHelper,
  getStatsNetWorthGrowthHelper,
} from "./helpers/stats.helpers";

// Re-exported for existing importers (e.g. Dashboard view model) after the
// helpers moved to ./helpers/stats.helpers.
export { getStatsDailyTransactionsHelper } from "./helpers/stats.helpers";

export interface IStatsService {
  useGetStatsDailyTransactions: (
    startDate: string,
    endDate: string,
    week?: boolean,
    type?: TransactionType,
  ) => ReturnType<
    typeof useQuery<{
      barsData?: BarDataType[];
      calendarData: MyCalendarData;
    }>
  >;
  useGetStatsDailyTransactionsRaw: (
    startDate: string,
    endDate: string,
    type?: TransactionType,
  ) => ReturnType<typeof useQuery<StatsDailyTransactions[]>>;
  useGetStatsMonthlyTransactionsTypes: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<DoubleBarPoint[]>>;
  useGetStatsMonthlyCategoriesTransactions: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<
    typeof useQuery<{
      groups: (PieData & { id: string })[];
      categories: (PieData & { id: string })[];
    }>
  >;
  useGetStatsMonthlyCategoriesTransactionsRaw: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<StatsMonthlyCategoriesTransactions[]>>;
  useGetStatsMonthlyAccountsTransactions: (
    startDate?: string,
    endDate?: string,
  ) => ReturnType<typeof useQuery<StatsMonthlyAccountsTransactions[]>>;
  useGetStatsNetWorthGrowth: (startDate?: string, endDate?: string) => ReturnType<typeof useQuery<LineChartPoint[]>>;
  useRefreshAllQueries: () => void;
  useGetDateRanges: () => {
    currentMonth: { start: string; end: string };
    currentYear: { start: string; end: string };
  };
  statsRepo: any;
}

export function useStatsService(): IStatsService {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const { dbContext } = useStorageMode();
  const statsRepo = dbContext.StatsRepository();
  const transactionRepo = dbContext.TransactionRepository();
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const useGetStatsDailyTransactions = (startDate: string, endDate: string, week = false, type?: TransactionType) => {
    return useQuery({
      queryKey: [ViewNames.StatsDailyTransactions, startDate, endDate, type, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
        return getStatsDailyTransactionsHelper(data, week);
      },
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsDailyTransactionsRaw = (startDate: string, endDate: string, type?: TransactionType) => {
    return useQuery<StatsDailyTransactions[]>({
      queryKey: [ViewNames.StatsDailyTransactions, "raw", startDate, endDate, type, tenantId],
      queryFn: async () => {
        return statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyTransactionsTypes = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: [ViewNames.StatsMonthlyTransactionsTypes, startDate, endDate, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
        return getStatsMonthlyTransactionsTypesHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyCategoriesTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<{
      groups: (PieData & { id: string })[];
      categories: (PieData & { id: string })[];
    }>({
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, startDate, endDate, tenantId],
      queryFn: async () => {
        const data = await statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
        return getStatsMonthlyCategoriesTransactionsDashboardHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyAccountsTransactions = (startDate?: string, endDate?: string) => {
    return useQuery<StatsMonthlyAccountsTransactions[]>({
      queryKey: [ViewNames.StatsMonthlyAccountsTransactions, startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  // New: Raw monthly categories transactions (no dashboard helper)
  const useGetStatsMonthlyCategoriesTransactionsRaw = (startDate?: string, endDate?: string) => {
    return useQuery<StatsMonthlyCategoriesTransactions[]>({
      queryKey: [ViewNames.StatsMonthlyCategoriesTransactions, "raw", startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  const useGetStatsNetWorthGrowth = (startDate?: string, endDate?: string) => {
    return useQuery<LineChartPoint[]>({
      queryKey: [ViewNames.StatsNetWorthGrowth, startDate, endDate, tenantId],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        const data = await statsRepo.getStatsNetWorthGrowth(tenantId, startDate, endDate);
        return getStatsNetWorthGrowthHelper(data);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useRefreshAllQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsDailyTransactions] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsMonthlyCategoriesTransactions] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsMonthlyTransactionsTypes] });
    await queryClient.invalidateQueries({ queryKey: [ViewNames.StatsNetWorthGrowth] });
  };

  const useGetDateRanges = () => ({
    currentMonth: {
      start: dayjs().utc().startOf("month").format("YYYY-MM-DD"),
      end: dayjs().utc().endOf("month").format("YYYY-MM-DD"),
    },
    currentYear: {
      start: dayjs().utc().startOf("year").toISOString(),
      end: dayjs().utc().endOf("year").toISOString(),
    },
  });

  return {
    useGetStatsDailyTransactions,
    useGetStatsDailyTransactionsRaw,
    useGetStatsMonthlyTransactionsTypes,
    useGetStatsMonthlyCategoriesTransactions,
    useGetStatsMonthlyAccountsTransactions,
    useGetStatsNetWorthGrowth,
    useGetStatsMonthlyCategoriesTransactionsRaw,
    useRefreshAllQueries,
    useGetDateRanges,
    statsRepo,
  };
}
