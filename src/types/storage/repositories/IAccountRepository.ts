import { Account, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Repository interface for Account entity operations
 * All storage implementations must implement this interface
 */
export interface IAccountRepository {
  /**
   * Get all accounts for a tenant
   * @param tenantId - The tenant ID to filter accounts
   * @returns Promise resolving to array of accounts with category information
   */
  getAllAccounts(tenantId: string): Promise<Account[]>;

  /**
   * Get a specific account by ID
   * @param id - The account ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to account with category information, or null if not found
   */
  getAccountById(id: string, tenantId: string): Promise<Account | null>;

  /**
   * Create a new account
   * @param account - Account data to insert
   * @returns Promise resolving to the created account data
   */
  createAccount(account: Inserts<TableNames.Accounts>): Promise<any>;

  /**
   * Update an existing account
   * @param account - Account data to update (must include id)
   * @returns Promise resolving to the updated account data
   */
  updateAccount(account: Updates<TableNames.Accounts>): Promise<any>;

  /**
   * Soft delete an account (set isdeleted = true)
   * @param id - The account ID to delete
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated account data
   */
  deleteAccount(id: string, userId?: string): Promise<any>;

  /**
   * Restore a soft-deleted account (set isdeleted = false)
   * @param id - The account ID to restore
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated account data
   */
  restoreAccount(id: string, userId?: string): Promise<any>;

  /**
   * Update account balance using stored procedure/function
   * @param accountid - The account ID
   * @param amount - The amount to add/subtract from balance
   * @returns Promise resolving to the function result
   */
  updateAccountBalance(accountid: string, amount: number): Promise<any>;

  /**
   * Get the initial/opening transaction for an account
   * @param accountid - The account ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to the opening transaction data
   */
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any>;

  /**
   * Get total balance across all accounts for a tenant
   * @param tenantId - The tenant ID
   * @returns Promise resolving to object with totalbalance property, or null
   */
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}