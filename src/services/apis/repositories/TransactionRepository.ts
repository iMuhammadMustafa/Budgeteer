import { ITransactionProvider } from '../../storage/types';

export class TransactionRepository {
  constructor(private provider: ITransactionProvider) {}

  async getAllTransactions(tenantId: string) {
    return this.provider.getAllTransactions(tenantId);
  }

  async getTransactions(searchFilters: any, tenantId: string) {
    return this.provider.getTransactions(searchFilters, tenantId);
  }

  async getTransactionFullyById(transactionid: string, tenantId: string) {
    return this.provider.getTransactionFullyById(transactionid, tenantId);
  }

  async getTransactionById(transactionid: string, tenantId: string) {
    return this.provider.getTransactionById(transactionid, tenantId);
  }

  async getTransactionByTransferId(id: string, tenantId: string) {
    return this.provider.getTransactionByTransferId(id, tenantId);
  }

  async getTransactionsByName(text: string, tenantId: string) {
    return this.provider.getTransactionsByName(text, tenantId);
  }

  async createTransaction(transaction: any) {
    return this.provider.createTransaction(transaction);
  }

  async createTransactions(transactions: any[]) {
    return this.provider.createTransactions(transactions);
  }

  async createMultipleTransactions(transactions: any[]) {
    return this.provider.createMultipleTransactions(transactions);
  }

  async updateTransaction(transaction: any) {
    return this.provider.updateTransaction(transaction);
  }

  async updateTransferTransaction(transaction: any) {
    return this.provider.updateTransferTransaction(transaction);
  }

  async deleteTransaction(id: string, userId: string) {
    return this.provider.deleteTransaction(id, userId);
  }

  async restoreTransaction(id: string, userId: string) {
    return this.provider.restoreTransaction(id, userId);
  }
}