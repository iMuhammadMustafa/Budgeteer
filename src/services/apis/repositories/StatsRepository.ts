import { IStatsProvider } from "../../storage/types";
import { StatsMonthlyCategoriesTransactions, TransactionType } from "@/src/types/db/Tables.Types";

/**
 * StatsRepository - Single source of truth for all statistics operations
 *
 * This repository consolidates all statistics-related APIs from multiple sources:
 * - Stats.supa.ts
 *
 * It serves as the centralized interface for statistics operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class StatsRepository {
  constructor(private provider: IStatsProvider) {}

  /**
   * Get daily transaction statistics for a tenant within a date range
   * @param tenantId - The tenant identifier
   * @param startDate - Optional start date for filtering (defaults to start of current week)
   * @param endDate - Optional end date for filtering (defaults to end of current week)
   * @param type - Optional transaction type filter (defaults to "Expense")
   * @returns Promise<any[]> - Array of daily transaction statistics
   */
  async getStatsDailyTransactions(tenantId: string, startDate?: string, endDate?: string, type?: TransactionType) {
    return this.provider.getStatsDailyTransactions(tenantId, startDate, endDate, type);
  }

  /**
   * Get monthly transaction statistics grouped by transaction type
   * @param tenantId - The tenant identifier
   * @param startDate - Optional start date for filtering (defaults to start of current week)
   * @param endDate - Optional end date for filtering (defaults to end of current week)
   * @returns Promise<any[]> - Array of monthly transaction type statistics
   */
  async getStatsMonthlyTransactionsTypes(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);
  }

  /**
   * Get monthly transaction statistics grouped by categories for expenses and adjustments
   * @param tenantId - The tenant identifier
   * @param startDate - Optional start date for filtering (defaults to start of current month)
   * @param endDate - Optional end date for filtering (defaults to end of current month)
   * @returns Promise<StatsMonthlyCategoriesTransactions[]> - Array of monthly category transaction statistics
   */
  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    return this.provider.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);
  }

  /**
   * Get monthly transaction statistics grouped by accounts
   * @param tenantId - The tenant identifier
   * @param startDate - Optional start date for filtering (defaults to start of current month)
   * @param endDate - Optional end date for filtering (defaults to end of current month)
   * @returns Promise<any[]> - Array of monthly account transaction statistics
   */
  async getStatsMonthlyAccountsTransactions(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);
  }

  /**
   * Get net worth growth statistics over time
   * @param tenantId - The tenant identifier
   * @param startDate - Optional start date for filtering (defaults to start of current year)
   * @param endDate - Optional end date for filtering (defaults to end of current year)
   * @returns Promise<any[]> - Array of net worth growth data points ordered by month
   */
  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string) {
    return this.provider.getStatsNetWorthGrowth(tenantId, startDate, endDate);
  }
}
