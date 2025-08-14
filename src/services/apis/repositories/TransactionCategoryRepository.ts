import { ITransactionCategoryProvider } from '../../storage/types';

export class TransactionCategoryRepository {
  constructor(private provider: ITransactionCategoryProvider) {}

  async getAllTransactionCategories(tenantId: string) {
    return this.provider.getAllTransactionCategories(tenantId);
  }

  async getTransactionCategoryById(id: string, tenantId: string) {
    return this.provider.getTransactionCategoryById(id, tenantId);
  }

  async createTransactionCategory(category: any) {
    return this.provider.createTransactionCategory(category);
  }

  async updateTransactionCategory(category: any) {
    return this.provider.updateTransactionCategory(category);
  }

  async deleteTransactionCategory(id: string, userId?: string) {
    return this.provider.deleteTransactionCategory(id, userId);
  }

  async restoreTransactionCategory(id: string, userId?: string) {
    return this.provider.restoreTransactionCategory(id, userId);
  }
}