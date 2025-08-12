import { Transaction, Inserts, Updates, TransactionsView } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

// Import the TransactionFilters type - this may need to be adjusted based on actual location
type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  name?: string;
  description?: string;
  accountId?: string;
  categoryId?: string;
  type?: string;
  // Add other filter properties as needed
};

/**
 * Repository interface for Transaction entity operations
 * All storage implementations must implement this interface
 */
export interface ITransactionRepository {
  /**
   * Get all transactions for a tenant
   * @param tenantId - The tenant ID to filter transactions
   * @returns Promise resolving to array of transactions with related data
   */
  getAllTransactions(tenantId: string): Promise<TransactionsView[]>;

  /**
   * Get transactions with filtering
   * @param searchFilters - Filter criteria for transactions
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to array of filtered transactions
   */
  getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]>;

  /**
   * Get a transaction with full details by ID
   * @param transactionid - The transaction ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to transaction with full related data, or null if not found
   */
  getTransactionFullyById(transactionid: string, tenantId: string): Promise<TransactionsView | null>;

  /**
   * Get a specific transaction by ID
   * @param transactionid - The transaction ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to transaction data, or null if not found
   */
  getTransactionById(transactionid: string, tenantId: string): Promise<Transaction | null>;

  /**
   * Get transaction by transfer ID
   * @param id - The transfer ID to search for
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to transaction data, or null if not found
   */
  getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView | null>;

  /**
   * Get transactions by name search
   * @param text - Text to search for in transaction names
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to array of matching transactions
   */
  getTransactionsByName(text: string, tenantId: string): Promise<any[]>;

  /**
   * Create a new transaction
   * @param transaction - Transaction data to insert
   * @returns Promise resolving to the created transaction data
   */
  createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any>;

  /**
   * Create multiple transactions
   * @param transactions - Array of transaction data to insert
   * @returns Promise resolving to the created transactions data
   */
  createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]>;

  /**
   * Create multiple transactions (alternative method)
   * @param transactions - Array of transaction data to insert
   * @returns Promise resolving to the created transactions data
   */
  createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]>;

  /**
   * Update an existing transaction
   * @param transaction - Transaction data to update (must include id)
   * @returns Promise resolving to the updated transaction data
   */
  updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>;

  /**
   * Update a transfer transaction
   * @param transaction - Transaction data to update (must include id)
   * @returns Promise resolving to the updated transaction data
   */
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>;

  /**
   * Soft delete a transaction (set isdeleted = true)
   * @param id - The transaction ID to delete
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated transaction data
   */
  deleteTransaction(id: string, userId: string): Promise<any>;

  /**
   * Restore a soft-deleted transaction (set isdeleted = false)
   * @param id - The transaction ID to restore
   * @param userId - User ID for audit trail
   * @returns Promise resolving to the updated transaction data
   */
  restoreTransaction(id: string, userId: string): Promise<any>;
}