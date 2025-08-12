import { Configuration, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Repository interface for Configuration entity operations
 * All storage implementations must implement this interface
 */
export interface IConfigurationRepository {
  /**
   * Get all configurations for a tenant
   * @param tenantId - The tenant ID to filter configurations
   * @returns Promise resolving to array of configurations
   */
  getAllConfigurations(tenantId: string): Promise<Configuration[]>;

  /**
   * Get a specific configuration by ID
   * @param id - The configuration ID
   * @param tenantId - The tenant ID for security filtering
   * @returns Promise resolving to configuration, or null if not found
   */
  getConfigurationById(id: string, tenantId: string): Promise<Configuration | null>;

  /**
   * Get configuration by table, type, and key
   * @param table - The table name the configuration applies to
   * @param type - The configuration type
   * @param key - The configuration key
   * @param tenantId - The tenant ID
   * @returns Promise resolving to configuration, or null if not found
   */
  getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration | null>;

  /**
   * Create a new configuration
   * @param configuration - Configuration data to insert
   * @returns Promise resolving to the created configuration data
   */
  createConfiguration(configuration: Inserts<TableNames.Configurations>): Promise<any>;

  /**
   * Update an existing configuration
   * @param configuration - Configuration data to update (must include id)
   * @returns Promise resolving to the updated configuration data
   */
  updateConfiguration(configuration: Updates<TableNames.Configurations>): Promise<any>;

  /**
   * Soft delete a configuration (set isdeleted = true)
   * @param id - The configuration ID to delete
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated configuration data
   */
  deleteConfiguration(id: string, userId?: string): Promise<any>;

  /**
   * Restore a soft-deleted configuration (set isdeleted = false)
   * @param id - The configuration ID to restore
   * @param userId - Optional user ID for audit trail
   * @returns Promise resolving to the updated configuration data
   */
  restoreConfiguration(id: string, userId?: string): Promise<any>;

  /**
   * Get configurations by table
   * @param tenantId - The tenant ID
   * @param table - The table name to filter by
   * @returns Promise resolving to array of configurations for the table
   */
  getConfigurationsByTable(tenantId: string, table: string): Promise<Configuration[]>;
}