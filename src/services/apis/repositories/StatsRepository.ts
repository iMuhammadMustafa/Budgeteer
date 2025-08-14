import { IStatsProvider } from '../../storage/types';

export class StatsRepository {
  constructor(private provider: IStatsProvider) {}

  async getStatsDailyTransactions(tenantId: string, startDate?: string, endDate?: string, type?: any) {
    return this.provider.getStatsDailyTransactions(tenantId, startDate, endDate, type);
  }

  async getStatsMonthlyTransactionsTypes(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
  }

  async getStatsMonthlyCategoriesTransactions(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
  }

  async getStatsMonthlyAccountsTransactions(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsNetWorthGrowth(tenantId, startDate, endDate);
  }
}