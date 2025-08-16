import {
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyAccountsTransactions,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/db/Tables.Types";

export interface IStatsRepository {
  getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]>;

  getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]>;

  getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]>;

  getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]>;

  getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<StatsNetWorthGrowth[]>;
}
