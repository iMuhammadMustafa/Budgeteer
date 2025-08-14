import { ITransactionGroupProvider } from '../../storage/types';

export class TransactionGroupRepository {
  constructor(private provider: ITransactionGroupProvider) {}

  async getAllTransactionGroups(tenantId: string) {
    return this.provider.getAllTransactionGroups(tenantId);
  }

  async getTransactionGroupById(id: string, tenantId: string) {
    return this.provider.getTransactionGroupById(id, tenantId);
  }

  async createTransactionGroup(group: any) {
    return this.provider.createTransactionGroup(group);
  }

  async updateTransactionGroup(group: any) {
    return this.provider.updateTransactionGroup(group);
  }

  async deleteTransactionGroup(id: string, userId?: string) {
    return this.provider.deleteTransactionGroup(id, userId);
  }

  async restoreTransactionGroup(id: string, userId?: string) {
    return this.provider.restoreTransactionGroup(id, userId);
  }
}