import { IConfigurationProvider } from '../../storage/types';

export class ConfigurationRepository {
  constructor(private provider: IConfigurationProvider) {}

  async getAllConfigurations(tenantId: string) {
    return this.provider.getAllConfigurations(tenantId);
  }

  async getConfigurationById(id: string, tenantId: string) {
    return this.provider.getConfigurationById(id, tenantId);
  }

  async getConfiguration(table: string, type: string, key: string, tenantId: string) {
    return this.provider.getConfiguration(table, type, key, tenantId);
  }

  async createConfiguration(config: any) {
    return this.provider.createConfiguration(config);
  }

  async updateConfiguration(config: any) {
    return this.provider.updateConfiguration(config);
  }

  async deleteConfiguration(id: string, userId?: string) {
    return this.provider.deleteConfiguration(id, userId);
  }

  async restoreConfiguration(id: string, userId?: string) {
    return this.provider.restoreConfiguration(id, userId);
  }
}