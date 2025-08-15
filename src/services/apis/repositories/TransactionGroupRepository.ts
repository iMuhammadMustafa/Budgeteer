import { ITransactionGroupProvider } from "../../storage/types";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

/**
 * TransactionGroupRepository - Single source of truth for all transaction group operations
 *
 * This repository consolidates all transaction group-related APIs from multiple sources:
 * - TransactionGroups.supa.ts
 *
 * It serves as the centralized interface for transaction group operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class TransactionGroupRepository {
  constructor(private provider: ITransactionGroupProvider) {}

  /**
   * Get all transaction groups for a tenant ordered by display order and name
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionGroup[]> - Array of transaction groups
   */
  async getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]> {
    return this.provider.getAllTransactionGroups(tenantId);
  }

  /**
   * Get a specific transaction group by ID
   * @param id - The transaction group ID
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionGroup | null> - Transaction group or null if not found
   */
  async getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup | null> {
    return this.provider.getTransactionGroupById(id, tenantId);
  }

  /**
   * Create a new transaction group
   * @param group - The transaction group data to insert
   * @returns Promise<TransactionGroup> - The created transaction group
   */
  async createTransactionGroup(group: Inserts<TableNames.TransactionGroups>): Promise<TransactionGroup> {
    return this.provider.createTransactionGroup(group);
  }

  /**
   * Update an existing transaction group
   * @param group - The transaction group data to update
   * @returns Promise<TransactionGroup> - The updated transaction group
   */
  async updateTransactionGroup(group: Updates<TableNames.TransactionGroups>): Promise<TransactionGroup> {
    return this.provider.updateTransactionGroup(group);
  }

  /**
   * Soft delete a transaction group (mark as deleted)
   * @param id - The transaction group ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<TransactionGroup> - The deleted transaction group
   */
  async deleteTransactionGroup(id: string, userId?: string): Promise<TransactionGroup> {
    return this.provider.deleteTransactionGroup(id, userId);
  }

  /**
   * Restore a soft-deleted transaction group
   * @param id - The transaction group ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<TransactionGroup> - The restored transaction group
   */
  async restoreTransactionGroup(id: string, userId?: string): Promise<TransactionGroup> {
    return this.provider.restoreTransactionGroup(id, userId);
  }
}
