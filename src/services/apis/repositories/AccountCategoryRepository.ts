import { IAccountCategoryProvider } from "../../storage/types";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

/**
 * AccountCategoryRepository - Single source of truth for all account category operations
 *
 * This repository consolidates all account category-related APIs from:
 * - AccountCategories.supa.ts
 *
 * It serves as the centralized interface for account category operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class AccountCategoryRepository {
  constructor(private provider: IAccountCategoryProvider) {}

  /**
   * Get all account categories for a tenant, ordered by display order and name
   * @param tenantId - The tenant identifier
   * @returns Promise<AccountCategory[]> - Array of account categories
   */
  async getAllAccountCategories(tenantId: string): Promise<AccountCategory[]> {
    return this.provider.getAllAccountCategories(tenantId);
  }

  /**
   * Get a specific account category by ID
   * @param id - The account category ID
   * @param tenantId - The tenant identifier
   * @returns Promise<AccountCategory | null> - Account category or null if not found
   */
  async getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory | null> {
    return this.provider.getAccountCategoryById(id, tenantId);
  }

  /**
   * Create a new account category
   * @param category - The account category data to insert
   * @returns Promise<AccountCategory> - The created account category
   */
  async createAccountCategory(category: Inserts<TableNames.AccountCategories>): Promise<AccountCategory> {
    return this.provider.createAccountCategory(category);
  }

  /**
   * Update an existing account category
   * @param category - The account category data to update
   * @returns Promise<AccountCategory> - The updated account category
   */
  async updateAccountCategory(category: Updates<TableNames.AccountCategories>): Promise<AccountCategory> {
    return this.provider.updateAccountCategory(category);
  }

  /**
   * Soft delete an account category (mark as deleted)
   * @param id - The account category ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<AccountCategory> - The deleted account category
   */
  async deleteAccountCategory(id: string, userId?: string): Promise<AccountCategory> {
    return this.provider.deleteAccountCategory(id, userId);
  }

  /**
   * Restore a soft-deleted account category
   * @param id - The account category ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<AccountCategory> - The restored account category
   */
  async restoreAccountCategory(id: string, userId?: string): Promise<AccountCategory> {
    return this.provider.restoreAccountCategory(id, userId);
  }
}
