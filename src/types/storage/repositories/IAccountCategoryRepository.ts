import { AccountCategory, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Repository interface for AccountCategory entity operations
 * All storage implementations must implement this interface
 */
export interface IAccountCategoryRepository {
  /**
   * Get all account categories for a tenant
   * @param tenantId - The tenant ID to filter categories
   * @returns Promise resolving to array of account categories
   */
  getAllAccountCategories(tenantId: string): Promise<AccountCategory[]>;

  /**
   * Get a specific account category by ID
   * @param id - The category ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to account category, or null if not found
   */
  getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory | null>;

  /**
   * Create a new account category
   * @param category - Category data to insert
   * @returns Promise resolving to the created category data
   */
  createAccountCategory(category: Inserts<TableNames.AccountCategories>): Promise<any>;

  /**
   * Update an existing account category
   * @param category - Category data to update (must include id)
   * @returns Promise resolving to the updated category data
   */
  updateAccountCategory(category: Updates<TableNames.AccountCategories>): Promise<any>;

  /**
   * Soft delete an account category (set isdeleted = true)
   * @param id - The category ID to delete
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated category data
   */
  deleteAccountCategory(id: string, userId?: string): Promise<any>;

  /**
   * Restore a soft-deleted account category (set isdeleted = false)
   * @param id - The category ID to restore
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated category data
   */
  restoreAccountCategory(id: string, userId?: string): Promise<any>;
}