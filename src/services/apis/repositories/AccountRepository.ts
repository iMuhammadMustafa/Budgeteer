import { IAccountProvider } from '../../storage/types';

export class AccountRepository {
  constructor(private provider: IAccountProvider) {}

  async getAllAccounts(tenantId: string) {
    return this.provider.getAllAccounts(tenantId);
  }

  async getAccountById(id: string, tenantId: string) {
    return this.provider.getAccountById(id, tenantId);
  }

  async createAccount(account: any) {
    return this.provider.createAccount(account);
  }

  async updateAccount(account: any) {
    return this.provider.updateAccount(account);
  }

  async deleteAccount(id: string, userId?: string) {
    return this.provider.deleteAccount(id, userId);
  }

  async restoreAccount(id: string, userId?: string) {
    return this.provider.restoreAccount(id, userId);
  }

  async updateAccountBalance(accountid: string, amount: number) {
    return this.provider.updateAccountBalance(accountid, amount);
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string) {
    return this.provider.getAccountOpenedTransaction(accountid, tenantId);
  }

  async getTotalAccountBalance(tenantId: string) {
    return this.provider.getTotalAccountBalance(tenantId);
  }
}