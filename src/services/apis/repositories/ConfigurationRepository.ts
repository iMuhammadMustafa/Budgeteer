import { IConfigurationProvider } from "../../storage/types";
import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

/**
 * ConfigurationRepository - Single source of truth for all configuration operations
 *
 * This repository consolidates all configuration-related APIs from multiple sources:
 * - Configurations.supa.ts
 *
 * It serves as the centralized interface for configuration operations across all storage modes
 * (cloud, local, demo) through dependency injection of storage providers.
 */
export class ConfigurationRepository {
  constructor(private provider: IConfigurationProvider) {}

  /**
   * Get all configurations for a tenant
   * @param tenantId - The tenant identifier
   * @returns Promise<Configuration[]> - Array of configurations
   */
  async getAllConfigurations(tenantId: string): Promise<Configuration[]> {
    return this.provider.getAllConfigurations(tenantId);
  }

  /**
   * Get a specific configuration by ID
   * @param id - The configuration ID
   * @param tenantId - The tenant identifier
   * @returns Promise<Configuration | null> - Configuration or null if not found
   */
  async getConfigurationById(id: string, tenantId: string): Promise<Configuration | null> {
    return this.provider.getConfigurationById(id, tenantId);
  }

  /**
   * Get a configuration by table, type, and key
   * @param table - The table name
   * @param type - The configuration type
   * @param key - The configuration key
   * @param tenantId - The tenant identifier
   * @returns Promise<Configuration | null> - Configuration or null if not found
   */
  async getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration | null> {
    return this.provider.getConfiguration(table, type, key, tenantId);
  }

  /**
   * Create a new configuration
   * @param configuration - The configuration data to insert
   * @returns Promise<Configuration> - The created configuration
   */
  async createConfiguration(configuration: Inserts<TableNames.Configurations>): Promise<Configuration> {
    return this.provider.createConfiguration(configuration);
  }

  /**
   * Update an existing configuration
   * @param configuration - The configuration data to update
   * @returns Promise<Configuration> - The updated configuration
   */
  async updateConfiguration(configuration: Updates<TableNames.Configurations>): Promise<Configuration> {
    return this.provider.updateConfiguration(configuration);
  }

  /**
   * Soft delete a configuration (mark as deleted)
   * @param id - The configuration ID to delete
   * @param userId - The user performing the deletion
   * @returns Promise<Configuration> - The deleted configuration
   */
  async deleteConfiguration(id: string, userId?: string): Promise<Configuration> {
    return this.provider.deleteConfiguration(id, userId);
  }

  /**
   * Restore a soft-deleted configuration
   * @param id - The configuration ID to restore
   * @param userId - The user performing the restoration
   * @returns Promise<Configuration> - The restored configuration
   */
  async restoreConfiguration(id: string, userId?: string): Promise<Configuration> {
    return this.provider.restoreConfiguration(id, userId);
  }
}
