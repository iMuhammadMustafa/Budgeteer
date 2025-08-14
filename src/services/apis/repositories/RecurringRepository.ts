import { IRecurringProvider } from '../../storage/types';

export class RecurringRepository {
  constructor(private provider: IRecurringProvider) {}

  async listRecurrings(params: { tenantId: string; filters?: any }) {
    return this.provider.listRecurrings(params);
  }

  async getRecurringById(id: string, tenantId: string) {
    return this.provider.getRecurringById(id, tenantId);
  }

  async createRecurring(recurringData: any, tenantId: string) {
    return this.provider.createRecurring(recurringData, tenantId);
  }

  async updateRecurring(id: string, recurringData: any, tenantId: string) {
    return this.provider.updateRecurring(id, recurringData, tenantId);
  }

  async deleteRecurring(id: string, tenantId: string, userId?: string) {
    return this.provider.deleteRecurring(id, tenantId, userId);
  }
}