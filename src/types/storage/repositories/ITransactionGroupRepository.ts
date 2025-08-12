import { TransactionGroup, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Repository interface for TransactionGroup entity operations
 * All storage implementations must implement this interface
 */
export interface ITransactionGroupRepository {
  /**
   * Get all transaction groups for a tenant
   * @param tenantId - The tenant ID to filter groups
   * @returns Promise resolving to array of transaction groups
   */
  getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]>;

  /**
   * Get a specific transaction group by ID
   * @param id - The group ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to transaction group, or null if not found
   */
  getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup | null>;

  /**
   * Create a new transaction group
   * @param group - Group data to insert
   * @returns Promise resolving to the created group data
   */
  createTransactionGroup(group: Inserts<TableNames.TransactionGroups>): Promise<any>;

  /**
   * Update an existing transaction group
   * @param group - Group data to update (must include id)
   * @returns Promise resolving to the updated group data
   */
  updateTransactionGroup(group: Updates<TableNames.TransactionGroups>): Promise<any>;

  /**
   * Soft delete a transaction group (set isdeleted = true)
   * @param id - The group ID to delete
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated group data
   */
  deleteTransactionGroup(id: string, userId: string): Promise<any>;

  /**
   * Restore a soft-deleted transaction group (set isdeleted = false)
   * @param id - The group ID to restore
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated group data
   */
  restoreTransactionGroup(id: string, userId: string): Promise<any>;
}