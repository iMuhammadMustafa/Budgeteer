import { db, LocalTransaction } from "./BudgeteerDatabase";
import { localTransactionsViewService } from "./TransactionsView.local";
import {
  StorageError,
  StorageErrorCode,
  ReferentialIntegrityError,
  RecordNotFoundError,
} from "../../storage/errors/StorageErrors";
import { Transaction, TransactionsView, Inserts, Updates } from "../../../types/db/Tables.Types";
import { TransactionFilters } from "../../../types/apis/TransactionFilters";
import { TableNames } from "../../../types/db/TableNames";
import { ITransactionProvider } from "../../../types/storage/providers/ITransactionProvider";
import { StorageMode } from "../../../types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

export class LocalTransactionProvider implements ITransactionProvider {
  readonly mode: StorageMode = StorageMode.Local;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getAllTransactions(tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        return await localTransactionsViewService.getAllTransactionsView(tenantId);
      },
      {
        storageMode: "local",
        operation: "getAllTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  async getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        return await localTransactionsViewService.getTransactionsView(searchFilters, tenantId);
      },
      {
        storageMode: "local",
        operation: "getTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  async getTransactionFullyById(transactionId: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        return await localTransactionsViewService.getTransactionViewById(transactionId, tenantId);
      },
      {
        storageMode: "local",
        operation: "getTransactionFullyById",
        table: "transactions",
        recordId: transactionId,
        tenantId,
      },
    );
  }

  async getTransactionById(transactionId: string, tenantId: string): Promise<Transaction | null> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transaction = await db.transactions
              .where("id")
              .equals(transactionId)
              .and(t => t.tenantid === tenantId && !t.isdeleted)
              .first();

            return (transaction as Transaction) || null;
          },
          "getTransactionById",
          "transactions",
          { transactionId, tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTransactionById",
        table: "transactions",
        recordId: transactionId,
        tenantId,
      },
    );
  }

  async getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            // Find transaction with matching transferid
            const transaction = await db.transactions
              .where("transferid")
              .equals(id)
              .and(t => t.tenantid === tenantId && !t.isdeleted)
              .first();

            if (!transaction) {
              return null;
            }

            // Use the view service to get full transaction data
            return await localTransactionsViewService.getTransactionViewById(transaction.id, tenantId);
          },
          "getTransactionByTransferId",
          "transactions",
          { transferId: id, tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTransactionByTransferId",
        table: "transactions",
        recordId: id,
        tenantId,
      },
    );
  }

  async getTransactionsByName(text: string, tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(
                t =>
                  !t.isdeleted &&
                  t.name !== null &&
                  t.name !== undefined &&
                  t.name.toLowerCase().includes(text.toLowerCase()),
              )
              .limit(7)
              .toArray();

            return transactions.map(t => ({
              label: t.name || "",
              item: { ...t, amount: t.amount },
            }));
          },
          "getTransactionsByName",
          "transactions",
          { searchText: text, tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTransactionsByName",
        table: "transactions",
        tenantId,
      },
    );
  }

  async createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const newTransaction: LocalTransaction = {
              id: transaction.id || uuidv4(),
              tenantid: transaction.tenantid || "",
              accountid: transaction.accountid,
              categoryid: transaction.categoryid,
              date: transaction.date,
              amount: transaction.amount || 0,
              type: transaction.type || "Expense",
              description: transaction.description || null,
              name: transaction.name || null,
              notes: transaction.notes || null,
              payee: transaction.payee || null,
              tags: transaction.tags || null,
              transferaccountid: transaction.transferaccountid || null,
              transferid: transaction.transferid || null,
              isdeleted: transaction.isdeleted || false,
              isvoid: transaction.isvoid || false,
              createdat: transaction.createdat || new Date().toISOString(),
              createdby: transaction.createdby || null,
              updatedat: transaction.updatedat || new Date().toISOString(),
              updatedby: transaction.updatedby || null,
            };

            // The referential integrity validation is handled by the Dexie hook
            await db.transactions.add(newTransaction);
            return newTransaction;
          },
          "createTransaction",
          "transactions",
          { transactionData: transaction },
        );
      },
      {
        storageMode: "local",
        operation: "createTransaction",
        table: "transactions",
      },
    );
  }

  async createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const newTransactions = transactions.map(
              transaction =>
                ({
                  id: transaction.id || uuidv4(),
                  tenantid: transaction.tenantid || "",
                  accountid: transaction.accountid,
                  categoryid: transaction.categoryid,
                  date: transaction.date,
                  amount: transaction.amount || 0,
                  type: transaction.type || "Expense",
                  description: transaction.description || null,
                  name: transaction.name || null,
                  notes: transaction.notes || null,
                  payee: transaction.payee || null,
                  tags: transaction.tags || null,
                  transferaccountid: transaction.transferaccountid || null,
                  transferid: transaction.transferid || null,
                  isdeleted: transaction.isdeleted || false,
                  isvoid: transaction.isvoid || false,
                  createdat: transaction.createdat || new Date().toISOString(),
                  createdby: transaction.createdby || null,
                  updatedat: transaction.updatedat || new Date().toISOString(),
                  updatedby: transaction.updatedby || null,
                }) as LocalTransaction,
            );

            await db.transactions.bulkAdd(newTransactions);
            return newTransactions;
          },
          "createTransactions",
          "transactions",
          { transactionCount: transactions.length },
        );
      },
      {
        storageMode: "local",
        operation: "createTransactions",
        table: "transactions",
      },
    );
  }

  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return this.createTransactions(transactions);
  }

  async updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            if (!transaction.id) {
              throw new StorageError("Transaction ID is required for update", StorageErrorCode.INVALID_DATA, {
                operation: "updateTransaction",
                table: "transactions",
              });
            }

            const updateData = {
              ...transaction,
              updatedat: new Date().toISOString(),
            };

            // The referential integrity validation is handled by the Dexie hook
            const updateCount = await db.transactions.update(transaction.id, updateData);

            if (updateCount === 0) {
              throw new RecordNotFoundError("transactions", transaction.id, {
                operation: "updateTransaction",
              });
            }

            const updatedTransaction = await db.transactions.get(transaction.id);
            return updatedTransaction;
          },
          "updateTransaction",
          "transactions",
          { transactionId: transaction.id },
        );
      },
      {
        storageMode: "local",
        operation: "updateTransaction",
        table: "transactions",
        recordId: transaction.id,
      },
    );
  }

  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return this.updateTransaction(transaction);
  }

  async deleteTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const updateData = {
              isdeleted: true,
              updatedby: userId,
              updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
            };

            const updateCount = await db.transactions.update(id, updateData);

            if (updateCount === 0) {
              throw new RecordNotFoundError("transactions", id, {
                operation: "deleteTransaction",
              });
            }

            const deletedTransaction = await db.transactions.get(id);
            return deletedTransaction;
          },
          "deleteTransaction",
          "transactions",
          { transactionId: id, userId },
        );
      },
      {
        storageMode: "local",
        operation: "deleteTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }

  async restoreTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const updateData = {
              isdeleted: false,
              updatedby: userId,
              updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
            };

            const updateCount = await db.transactions.update(id, updateData);

            if (updateCount === 0) {
              throw new RecordNotFoundError("transactions", id, {
                operation: "restoreTransaction",
              });
            }

            const restoredTransaction = await db.transactions.get(id);
            return restoredTransaction;
          },
          "restoreTransaction",
          "transactions",
          { transactionId: id, userId },
        );
      },
      {
        storageMode: "local",
        operation: "restoreTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const localTransactionProvider = new LocalTransactionProvider();

// Legacy function exports for backward compatibility
export const getAllTransactions = localTransactionProvider.getAllTransactions.bind(localTransactionProvider);
export const getTransactionById = localTransactionProvider.getTransactionById.bind(localTransactionProvider);
export const createTransaction = localTransactionProvider.createTransaction.bind(localTransactionProvider);
export const updateTransaction = localTransactionProvider.updateTransaction.bind(localTransactionProvider);
export const deleteTransaction = localTransactionProvider.deleteTransaction.bind(localTransactionProvider);
export const restoreTransaction = localTransactionProvider.restoreTransaction.bind(localTransactionProvider);
