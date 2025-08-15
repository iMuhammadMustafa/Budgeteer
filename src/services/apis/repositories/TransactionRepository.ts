import { ITransactionProvider } from "../../storage/types";
import { Transaction, Inserts, Updates, TransactionsView } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.types";

/**
 * TransactionRepository - Single source of truth for all transaction operations
 *
 * This repository consolidates all transaction-related APIs from multiple sources:
 * - Transactions.supa.ts
 *
 * It serves as the centralized interface for transaction operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class TransactionRepository {
  constructor(private provider: ITransactionProvider) {}

  /**
   * Get all transactions for a tenant
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionsView[]> - Array of transactions with all related data
   */
  async getAllTransactions(tenantId: string): Promise<TransactionsView[]> {
    return this.provider.getAllTransactions(tenantId);
  }

  /**
   * Get transactions with advanced filtering and pagination
   * @param searchFilters - Filters to apply to the transaction search
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionsView[]> - Array of filtered transactions
   */
  async getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    return this.provider.getTransactions(searchFilters, tenantId);
  }

  /**
   * Get a specific transaction by ID with full details from the view
   * @param transactionid - The transaction ID
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionsView | null> - Transaction with all related data or null if not found
   */
  async getTransactionFullyById(transactionid: string, tenantId: string): Promise<TransactionsView | null> {
    return this.provider.getTransactionFullyById(transactionid, tenantId);
  }

  /**
   * Get a specific transaction by ID from the base table
   * @param transactionid - The transaction ID
   * @param tenantId - The tenant identifier
   * @returns Promise<Transaction | null> - Transaction or null if not found
   */
  async getTransactionById(transactionid: string, tenantId: string): Promise<Transaction | null> {
    return this.provider.getTransactionById(transactionid, tenantId);
  }

  /**
   * Get a transaction by its transfer ID
   * @param id - The transfer ID
   * @param tenantId - The tenant identifier
   * @returns Promise<TransactionsView | null> - Transaction with transfer details or null if not found
   */
  async getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView | null> {
    return this.provider.getTransactionByTransferId(id, tenantId);
  }

  /**
   * Search for transactions by name with auto-complete functionality
   * @param text - The search text to match against transaction names
   * @param tenantId - The tenant identifier
   * @returns Promise<SearchableDropdownItem[]> - Array of matching transaction names for dropdown
   */
  async getTransactionsByName(text: string, tenantId: string): Promise<SearchableDropdownItem[]> {
    return this.provider.getTransactionsByName(text, tenantId);
  }

  /**
   * Create a new transaction
   * @param transaction - The transaction data to insert
   * @returns Promise<Transaction> - The created transaction
   */
  async createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<Transaction> {
    return this.provider.createTransaction(transaction);
  }

  /**
   * Create multiple transactions in a single operation
   * @param transactions - Array of transaction data to insert
   * @returns Promise<Transaction[]> - Array of created transactions
   */
  async createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]> {
    return this.provider.createTransactions(transactions);
  }

  /**
   * Create multiple transactions in a single operation (alias for createTransactions)
   * @param transactions - Array of transaction data to insert
   * @returns Promise<Transaction[]> - Array of created transactions
   */
  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]> {
    return this.provider.createMultipleTransactions(transactions);
  }

  /**
   * Update an existing transaction
   * @param transaction - The transaction data to update
   * @returns Promise<Transaction> - The updated transaction
   */
  async updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction> {
    return this.provider.updateTransaction(transaction);
  }

  /**
   * Update a transfer transaction by transfer ID
   * @param transaction - The transaction data to update (must include transferid)
   * @returns Promise<Transaction> - The updated transfer transaction
   */
  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction> {
    return this.provider.updateTransferTransaction(transaction);
  }

  /**
   * Soft delete a transaction (mark as deleted)
   * @param id - The transaction ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<Transaction> - The deleted transaction
   */
  async deleteTransaction(id: string, userId: string): Promise<Transaction> {
    return this.provider.deleteTransaction(id, userId);
  }

  /**
   * Restore a soft-deleted transaction
   * @param id - The transaction ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<any> - Result from the restoration operation
   */
  async restoreTransaction(id: string, userId: string): Promise<any> {
    return this.provider.restoreTransaction(id, userId);
  }
}
