import { IAccountProvider } from "../../storage/types";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

/**
 * AccountRepository - Single source of truth for all account operations
 *
 * This repository consolidates all account-related APIs from multiple sources:
 * - Accounts.supa.ts
 * - Accounts.enhanced.supa.ts
 *
 * It serves as the centralized interface for account operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class AccountRepository {
  constructor(private provider: IAccountProvider) {}

  /**
   * Get all accounts for a tenant with their categories
   * @param tenantId - The tenant identifier
   * @returns Promise<Account[]> - Array of accounts with category details
   */
  async getAllAccounts(tenantId: string): Promise<Account[]> {
    return this.provider.getAllAccounts(tenantId);
  }

  /**
   * Get a specific account by ID with its category and running balance
   * @param id - The account ID
   * @param tenantId - The tenant identifier
   * @returns Promise<Account | null> - Account with category details or null if not found
   */
  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    return this.provider.getAccountById(id, tenantId);
  }

  /**
   * Create a new account
   * @param account - The account data to insert
   * @returns Promise<Account> - The created account
   */
  async createAccount(account: Inserts<TableNames.Accounts>): Promise<Account> {
    return this.provider.createAccount(account);
  }

  /**
   * Update an existing account
   * @param account - The account data to update
   * @returns Promise<Account> - The updated account
   */
  async updateAccount(account: Updates<TableNames.Accounts>): Promise<Account> {
    return this.provider.updateAccount(account);
  }

  /**
   * Soft delete an account (mark as deleted)
   * @param id - The account ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<Account> - The deleted account
   */
  async deleteAccount(id: string, userId?: string): Promise<Account> {
    return this.provider.deleteAccount(id, userId);
  }

  /**
   * Restore a soft-deleted account
   * @param id - The account ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<Account> - The restored account
   */
  async restoreAccount(id: string, userId?: string): Promise<Account> {
    return this.provider.restoreAccount(id, userId);
  }

  /**
   * Update account balance using database function
   * @param accountid - The account ID
   * @param amount - The amount to adjust the balance by
   * @returns Promise<any> - Result from the balance update function
   */
  async updateAccountBalance(accountid: string, amount: number): Promise<any> {
    return this.provider.updateAccountBalance(accountid, amount);
  }

  /**
   * Get the opening transaction for an account
   * @param accountid - The account ID
   * @param tenantId - The tenant identifier
   * @returns Promise<any> - The opening transaction details
   */
  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any> {
    return this.provider.getAccountOpenedTransaction(accountid, tenantId);
  }

  /**
   * Get the total balance across all accounts for a tenant
   * @param tenantId - The tenant identifier
   * @returns Promise<{ totalbalance: number } | null> - Total balance or null if no accounts
   */
  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    return this.provider.getTotalAccountBalance(tenantId);
  }
}
