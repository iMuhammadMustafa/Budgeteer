// Mock implementation for Transactions API

import { Transaction, TransactionsView, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { ITransactionProvider } from "@/src/types/storage/providers/ITransactionProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";
import {
  transactions,
  accounts,
  transactionCategories,
  transactionGroups,
  validateReferentialIntegrity,
} from "./mockDataStore";

const toTransactionsView = (tr: Transaction): TransactionsView => {
  const account = accounts.find(acc => acc.id === tr.accountid) ?? null;
  const category = transactionCategories.find(cat => cat.id === tr.categoryid) ?? null;
  const group = category && category.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;

  return {
    accountid: tr.accountid,
    accountname: account?.name ?? null,
    amount: tr.amount,
    balance: account?.balance ?? null,
    categoryid: tr.categoryid,
    categoryname: category?.name ?? null,
    createdat: tr.createdat,
    currency: account?.currency ?? null,
    date: tr.date,
    groupicon: group?.icon ?? null,
    groupid: group?.id ?? null,
    groupname: group?.name ?? null,
    icon: category?.icon ?? null,
    id: tr.id,
    isvoid: tr.isvoid,
    name: tr.name,
    payee: tr.payee,
    runningbalance: null, // Would be calculated in real implementation
    tenantid: tr.tenantid,
    transferaccountid: tr.transferaccountid,
    transferid: tr.transferid,
    type: tr.type,
    updatedat: tr.updatedat,
  };
};

export class MockTransactionProvider implements ITransactionProvider {
  readonly mode: StorageMode = StorageMode.Demo;
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
        return transactions
          .filter(tr => (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted)
          .map(toTransactionsView);
      },
      {
        storageMode: "demo",
        operation: "getAllTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  async getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        let filtered = transactions.filter(tr => (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted);

        // Apply filters
        if (searchFilters.startDate) {
          filtered = filtered.filter(tr => tr.date >= searchFilters.startDate!);
        }
        if (searchFilters.endDate) {
          filtered = filtered.filter(tr => tr.date <= searchFilters.endDate!);
        }
        if (searchFilters.name) {
          filtered = filtered.filter(tr => tr.name?.toLowerCase().includes(searchFilters.name!.toLowerCase()));
        }
        if (searchFilters.description) {
          filtered = filtered.filter(tr =>
            tr.description?.toLowerCase().includes(searchFilters.description!.toLowerCase()),
          );
        }
        if (searchFilters.amount !== undefined) {
          filtered = filtered.filter(tr => tr.amount === searchFilters.amount);
        }
        if (searchFilters.categoryid) {
          filtered = filtered.filter(tr => tr.categoryid === searchFilters.categoryid);
        }
        if (searchFilters.accountid) {
          filtered = filtered.filter(tr => tr.accountid === searchFilters.accountid);
        }
        if (searchFilters.isVoid !== undefined) {
          filtered = filtered.filter(tr => tr.isvoid === Boolean(searchFilters.isVoid));
        }
        if (searchFilters.type) {
          filtered = filtered.filter(tr => tr.type === searchFilters.type);
        }
        if (searchFilters.tags && searchFilters.tags.length > 0) {
          filtered = filtered.filter(tr => tr.tags && tr.tags.some(tag => searchFilters.tags!.includes(tag)));
        }

        // Apply pagination
        if (searchFilters.startIndex !== undefined && searchFilters.endIndex !== undefined) {
          filtered = filtered.slice(searchFilters.startIndex, searchFilters.endIndex + 1);
        }

        return filtered.map(toTransactionsView);
      },
      {
        storageMode: "demo",
        operation: "getTransactions",
        table: "transactions",
        tenantId,
      },
    );
  }

  async getTransactionFullyById(transactionid: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        const transaction = transactions.find(
          tr => tr.id === transactionid && (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted,
        );
        if (!transaction) {
          return null;
        }
        return toTransactionsView(transaction);
      },
      {
        storageMode: "demo",
        operation: "getTransactionFullyById",
        table: "transactions",
        recordId: transactionid,
        tenantId,
      },
    );
  }

  async getTransactionById(transactionid: string, tenantId: string): Promise<Transaction | null> {
    return withStorageErrorHandling(
      async () => {
        const transaction = transactions.find(
          tr => tr.id === transactionid && (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted,
        );
        return transaction ?? null;
      },
      {
        storageMode: "demo",
        operation: "getTransactionById",
        table: "transactions",
        recordId: transactionid,
        tenantId,
      },
    );
  }

  async getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        const transaction = transactions.find(
          tr => tr.transferid === id && (tr.tenantid === tenantId || tenantId === "demo") && !tr.isdeleted,
        );
        if (!transaction) {
          return null;
        }
        return toTransactionsView(transaction);
      },
      {
        storageMode: "demo",
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
        const filtered = transactions.filter(
          tr =>
            tr.name?.toLowerCase().includes(text.toLowerCase()) &&
            (tr.tenantid === tenantId || tenantId === "demo") &&
            !tr.isdeleted,
        );

        return filtered.slice(0, 7).map(transaction => ({
          label: transaction.name!,
          item: { ...transaction, amount: transaction.amount },
        }));
      },
      {
        storageMode: "demo",
        operation: "getTransactionsByName",
        table: "transactions",
        tenantId,
      },
    );
  }

  async createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate referential integrity
        validateReferentialIntegrity.validateAccount(transaction.accountid);
        validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);

        if (transaction.transferaccountid) {
          validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
        }
        if (transaction.transferid) {
          validateReferentialIntegrity.validateTransaction(transaction.transferid);
        }

        const newTransaction = {
          ...transaction,
          id: transaction.id || `tr-${Date.now()}`, // Use provided ID or generate one
          amount: transaction.amount || 0,
          isdeleted: false,
          isvoid: false,
          createdat: new Date().toISOString(),
          createdby: transaction.createdby || "demo",
          updatedat: null,
          updatedby: null,
          tenantid: transaction.tenantid || "demo",
          type: transaction.type || "Expense",
          description: transaction.description || null,
          name: transaction.name || null,
          payee: transaction.payee || null,
          tags: transaction.tags || null,
          notes: transaction.notes || null,
          transferaccountid: transaction.transferaccountid || null,
          transferid: transaction.transferid || null,
        };

        transactions.push(newTransaction);
        return newTransaction;
      },
      {
        storageMode: "demo",
        operation: "createTransaction",
        table: "transactions",
        tenantId: transaction.tenantid,
      },
    );
  }

  async createTransactions(txns: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const createdTransactions = [];

        for (let i = 0; i < txns.length; i++) {
          const transaction = txns[i];

          // Validate referential integrity for each transaction
          validateReferentialIntegrity.validateAccount(transaction.accountid);
          validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);

          if (transaction.transferaccountid) {
            validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
          }

          const newTransaction = {
            ...transaction,
            id: `tr-batch-${Date.now()}-${i}`,
            amount: transaction.amount || 0,
            isdeleted: false,
            isvoid: false,
            createdat: new Date().toISOString(),
            createdby: transaction.createdby || "demo",
            updatedat: null,
            updatedby: null,
            tenantid: transaction.tenantid || "demo",
            type: transaction.type || "Expense",
            description: transaction.description || null,
            name: transaction.name || null,
            payee: transaction.payee || null,
            tags: transaction.tags || null,
            notes: transaction.notes || null,
            transferaccountid: transaction.transferaccountid || null,
            transferid: transaction.transferid || null,
          };

          transactions.push(newTransaction);
          createdTransactions.push(newTransaction);
        }

        return createdTransactions;
      },
      {
        storageMode: "demo",
        operation: "createTransactions",
        table: "transactions",
        tenantId: txns.length > 0 ? txns[0].tenantid : "demo",
      },
    );
  }

  async createMultipleTransactions(txns: Inserts<TableNames.Transactions>[]): Promise<any[]> {
    return this.createTransactions(txns); // Same implementation
  }

  async updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = transactions.findIndex(tr => tr.id === transaction.id);
        if (index === -1) {
          throw new Error("Transaction not found");
        }

        // Validate referential integrity if fields are being updated
        if (transaction.accountid) {
          validateReferentialIntegrity.validateAccount(transaction.accountid);
        }
        if (transaction.categoryid) {
          validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
        }
        if (transaction.transferaccountid) {
          validateReferentialIntegrity.validateAccount(transaction.transferaccountid);
        }
        if (transaction.transferid) {
          validateReferentialIntegrity.validateTransaction(transaction.transferid);
        }

        transactions[index] = {
          ...transactions[index],
          ...transaction,
          updatedat: new Date().toISOString(),
        };

        return transactions[index];
      },
      {
        storageMode: "demo",
        operation: "updateTransaction",
        table: "transactions",
        recordId: transaction.id,
        tenantId: transaction.tenantid,
      },
    );
  }

  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = transactions.findIndex(tr => tr.transferid === transaction.transferid);
        if (index === -1) {
          throw new Error("Transfer transaction not found");
        }

        // Validate referential integrity if fields are being updated
        if (transaction.accountid) {
          validateReferentialIntegrity.validateAccount(transaction.accountid);
        }
        if (transaction.categoryid) {
          validateReferentialIntegrity.validateTransactionCategory(transaction.categoryid);
        }

        transactions[index] = {
          ...transactions[index],
          ...transaction,
          updatedat: new Date().toISOString(),
        };

        return transactions[index];
      },
      {
        storageMode: "demo",
        operation: "updateTransferTransaction",
        table: "transactions",
        recordId: transaction.transferid || undefined,
        tenantId: transaction.tenantid,
      },
    );
  }

  async deleteTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = transactions.findIndex(tr => tr.id === id);
        if (index === -1) {
          throw new Error("Transaction not found");
        }

        transactions[index].isdeleted = true;
        transactions[index].updatedby = userId;
        transactions[index].updatedat = new Date().toISOString();

        return transactions[index];
      },
      {
        storageMode: "demo",
        operation: "deleteTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }

  async restoreTransaction(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = transactions.findIndex(tr => tr.id === id);
        if (index === -1) {
          throw new Error("Transaction not found");
        }

        transactions[index].isdeleted = false;
        transactions[index].updatedby = userId;
        transactions[index].updatedat = new Date().toISOString();

        return transactions[index];
      },
      {
        storageMode: "demo",
        operation: "restoreTransaction",
        table: "transactions",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const mockTransactionProvider = new MockTransactionProvider();

// Legacy function exports for backward compatibility
export const getAllTransactions = (tenantId: string) => mockTransactionProvider.getAllTransactions(tenantId);
export const getTransactions = (searchFilters: TransactionFilters, tenantId: string) =>
  mockTransactionProvider.getTransactions(searchFilters, tenantId);
export const getTransactionFullyById = (transactionid: string, tenantId: string) =>
  mockTransactionProvider.getTransactionFullyById(transactionid, tenantId);
export const getTransactionById = (transactionid: string, tenantId: string) =>
  mockTransactionProvider.getTransactionById(transactionid, tenantId);
export const getTransactionByTransferId = (id: string, tenantId: string) =>
  mockTransactionProvider.getTransactionByTransferId(id, tenantId);
export const getTransactionsByName = (text: string, tenantId: string) =>
  mockTransactionProvider.getTransactionsByName(text, tenantId);
export const createTransaction = (transaction: Inserts<TableNames.Transactions>) =>
  mockTransactionProvider.createTransaction(transaction);
export const createTransactions = (txns: Inserts<TableNames.Transactions>[]) =>
  mockTransactionProvider.createTransactions(txns);
export const createMultipleTransactions = (txns: Inserts<TableNames.Transactions>[]) =>
  mockTransactionProvider.createMultipleTransactions(txns);
export const updateTransaction = (transaction: Updates<TableNames.Transactions>) =>
  mockTransactionProvider.updateTransaction(transaction);
export const updateTransferTransaction = (transaction: Updates<TableNames.Transactions>) =>
  mockTransactionProvider.updateTransferTransaction(transaction);
export const deleteTransaction = (id: string, userId: string) => mockTransactionProvider.deleteTransaction(id, userId);
export const restoreTransaction = (id: string, userId: string) =>
  mockTransactionProvider.restoreTransaction(id, userId);
