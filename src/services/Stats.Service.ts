import { useAuth } from "@/src/providers/AuthProvider";
import { resolveTenantId } from "@/src/utils/tenant";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import {
  BarDataType,
  DoubleBarPoint,
  LineChartPoint,
  MyCalendarData,
  PieData,
} from "@/src/types/components/Charts.types";
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
import { queryKeys } from "./queryKeys";

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
  const tenantId = resolveTenantId(session);
  const { dbContext } = useStorageMode();
  const statsRepo = dbContext.StatsRepository();
  const transactionRepo = dbContext.TransactionRepository();
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const useGetStatsDailyTransactions = (startDate: string, endDate: string, week = false, type?: TransactionType) => {
    return useQuery({
      queryKey: queryKeys.stats.daily(startDate, endDate, type, tenantId),
      queryFn: async () => {
        const data = await statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
        return getStatsDailyTransactionsHelper(data, week);
      },
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsDailyTransactionsRaw = (startDate: string, endDate: string, type?: TransactionType) => {
    return useQuery<StatsDailyTransactions[]>({
      queryKey: queryKeys.stats.dailyRaw(startDate, endDate, type, tenantId),
      queryFn: async () => {
        return statsRepo.getStatsDailyTransactions(tenantId, startDate, endDate, type);
      },
      enabled: !!tenantId,
      placeholderData: (prev: any) => prev,
    });
  };

  const useGetStatsMonthlyTransactionsTypes = (startDate?: string, endDate?: string) => {
    return useQuery({
      queryKey: queryKeys.stats.monthlyTypes(startDate, endDate, tenantId),
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
      queryKey: queryKeys.stats.monthlyCategories(startDate, endDate, tenantId),
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
      queryKey: queryKeys.stats.monthlyAccounts(startDate, endDate, tenantId),
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
      queryKey: queryKeys.stats.monthlyCategoriesRaw(startDate, endDate, tenantId),
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return statsRepo.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
      },
      enabled: !!tenantId,
    });
  };

  const useGetStatsNetWorthGrowth = (startDate?: string, endDate?: string) => {
    return useQuery<LineChartPoint[]>({
      queryKey: queryKeys.stats.netWorth(startDate, endDate, tenantId),
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
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.dailyAll });
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.monthlyCategoriesAll });
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.monthlyTypesAll });
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.netWorthAll });
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
