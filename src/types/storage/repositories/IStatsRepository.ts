import { 
  StatsDailyTransactions, 
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions, 
  StatsMonthlyAccountsTransactions,
  TransactionType 
} from '@/src/types/db/Tables.Types';

/**
 * Repository interface for Statistics and reporting operations
 * All storage implementations must implement this interface
 */
export interface IStatsRepository {
  /**
   * Get daily transaction statistics for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Optional start date for filtering (defaults to start of week)
   * @param endDate - Optional end date for filtering (defaults to end of week)
   * @param type - Optional transaction type filter (defaults to 'Expense')
   * @returns Promise resolving to array of daily transaction statistics
   */
  getStatsDailyTransactions(
    tenantId: string, 
    startDate?: string, 
    endDate?: string, 
    type?: TransactionType
  ): Promise<StatsDailyTransactions[]>;

  /**
   * Get monthly transaction statistics by type for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Optional start date for filtering (defaults to start of week)
   * @param endDate - Optional end date for filtering (defaults to end of week)
   * @returns Promise resolving to array of monthly transaction type statistics
   */
  getStatsMonthlyTransactionsTypes(
    tenantId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<StatsMonthlyTransactionsTypes[]>;

  /**
   * Get monthly transaction statistics by category for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Optional start date for filtering (defaults to start of month)
   * @param endDate - Optional end date for filtering (defaults to end of month)
   * @returns Promise resolving to array of monthly category transaction statistics
   */
  getStatsMonthlyCategoriesTransactions(
    tenantId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<StatsMonthlyCategoriesTransactions[]>;

  /**
   * Get monthly transaction statistics by account for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Optional start date for filtering (defaults to start of month)
   * @param endDate - Optional end date for filtering (defaults to end of month)
   * @returns Promise resolving to array of monthly account transaction statistics
   */
  getStatsMonthlyAccountsTransactions(
    tenantId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<StatsMonthlyAccountsTransactions[]>;

  /**
   * Get net worth growth statistics for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Optional start date for filtering (defaults to start of year)
   * @param endDate - Optional end date for filtering (defaults to end of year)
   * @returns Promise resolving to array of net worth growth statistics
   */
  getStatsNetWorthGrowth(
    tenantId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<any[]>; // Using any[] as the exact type isn't defined in Tables.Types.ts
}