import { ITransactionCategoryProvider } from "../../storage/types";
import { TransactionCategory, TransactionCategoryAndGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

/**
 * TransactionCategoryRepository - Single source of truth for all transaction category operations
 *
 * This repository consolidates all transaction category-related APIs from multiple sources:
 * - TransactionCategories.supa.ts
 *
 * It serves as the centralized interface for transaction category operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class TransactionCategoryRepository {
  constructor(private provider: ITransactionCategoryProvider) {}

  /**
   * Get all transaction categories for a tenant with their transaction groups
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionCategoryAndGroup[]> - Array of transaction categories with group details
   */
  async getAllTransactionCategories(tenantId: string): Promise<TransactionCategoryAndGroup[]> {
    return this.provider.getAllTransactionCategories(tenantId);
  }

  /**
   * Get a specific transaction category by ID
   * @param id - The transaction category ID
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionCategory | null> - Transaction category or null if not found
   */
  async getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory | null> {
    return this.provider.getTransactionCategoryById(id, tenantId);
  }

  /**
   * Create a new transaction category
   * @param category - The transaction category data to insert
   * @returns Promise<TransactionCategory> - The created transaction category
   */
  async createTransactionCategory(category: Inserts<TableNames.TransactionCategories>): Promise<TransactionCategory> {
    return this.provider.createTransactionCategory(category);
  }

  /**
   * Update an existing transaction category
   * @param category - The transaction category data to update
   * @returns Promise<TransactionCategory> - The updated transaction category
   */
  async updateTransactionCategory(category: Updates<TableNames.TransactionCategories>): Promise<TransactionCategory> {
    return this.provider.updateTransactionCategory(category);
  }

  /**
   * Soft delete a transaction category (mark as deleted)
   * @param id - The transaction category ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<TransactionCategory> - The deleted transaction category
   */
  async deleteTransactionCategory(id: string, userId?: string): Promise<TransactionCategory> {
    return this.provider.deleteTransactionCategory(id, userId);
  }

  /**
   * Restore a soft-deleted transaction category
   * @param id - The transaction category ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<TransactionCategory> - The restored transaction category
   */
  async restoreTransactionCategory(id: string, userId?: string): Promise<TransactionCategory> {
    return this.provider.restoreTransactionCategory(id, userId);
  }
}
