import { TransactionCategory, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Repository interface for TransactionCategory entity operations
 * All storage implementations must implement this interface
 */
export interface ITransactionCategoryRepository {
  /**
   * Get all transaction categories for a tenant
   * @param tenantId - The tenant ID to filter categories
   * @returns Promise resolving to array of transaction categories with group information
   */
  getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]>;

  /**
   * Get a specific transaction category by ID
   * @param id - The category ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to transaction category with group information, or null if not found
   */
  getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory | null>;

  /**
   * Create a new transaction category
   * @param category - Category data to insert
   * @returns Promise resolving to the created category data
   */
  createTransactionCategory(category: Inserts<TableNames.TransactionCategories>): Promise<any>;

  /**
   * Update an existing transaction category
   * @param category - Category data to update (must include id)
   * @returns Promise resolving to the updated category data
   */
  updateTransactionCategory(category: Updates<TableNames.TransactionCategories>): Promise<any>;

  /**
   * Soft delete a transaction category (set isdeleted = true)
   * @param id - The category ID to delete
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated category data
   */
  deleteTransactionCategory(id: string, userId: string): Promise<any>;

  /**
   * Restore a soft-deleted transaction category (set isdeleted = false)
   * @param id - The category ID to restore
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated category data
   */
  restoreTransactionCategory(id: string, userId: string): Promise<any>;

  /**
   * Get transaction categories by group
   * @param tenantId - The tenant ID
   * @param groupId - The group ID to filter by
   * @returns Promise resolving to array of categories in the group
   */
  getTransactionCategoriesByGroup(tenantId: string, groupId: string): Promise<TransactionCategory[]>;
}