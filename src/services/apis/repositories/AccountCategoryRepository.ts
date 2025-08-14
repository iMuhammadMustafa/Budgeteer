import { IAccountCategoryProvider } from '../../storage/types';

export class AccountCategoryRepository {
  constructor(private provider: IAccountCategoryProvider) {}

  async getAllAccountCategories(tenantId: string) {
    return this.provider.getAllAccountCategories(tenantId);
  }

  async getAccountCategoryById(id: string, tenantId: string) {
    return this.provider.getAccountCategoryById(id, tenantId);
  }

  async createAccountCategory(category: any) {
    return this.provider.createAccountCategory(category);
  }

  async updateAccountCategory(category: any) {
    return this.provider.updateAccountCategory(category);
  }

  async deleteAccountCategory(id: string, userId?: string) {
    return this.provider.deleteAccountCategory(id, userId);
  }

  async restoreAccountCategory(id: string, userId?: string) {
    return this.provider.restoreAccountCategory(id, userId);
  }
}