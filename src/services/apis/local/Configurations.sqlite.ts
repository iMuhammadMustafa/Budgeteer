import { IConfigurationProvider, StorageError, StorageErrorCode } from '../../storage/types';
import { sqliteDb, LocalConfiguration } from './BudgeteerSQLiteDatabase';
import { Database } from '../../../types/db/database.types';
import { SQLiteErrorMapper } from './SQLiteErrorMapper';
import { v4 as uuidv4 } from 'uuid';

type ConfigurationInsert = Database['public']['Tables']['configurations']['Insert'];
type ConfigurationUpdate = Database['public']['Tables']['configurations']['Update'];

export class SQLiteConfigurationProvider implements IConfigurationProvider {
  private get db() {
    return sqliteDb.getDatabase();
  }

  async getAllConfigurations(tenantId: string): Promise<LocalConfiguration[]> {
    try {
      const configurations = await this.db.getAllAsync(
        'SELECT * FROM configurations WHERE tenantid = ? AND isdeleted = 0 ORDER BY table_name, key',
        [tenantId]
      ) as any[];
      
      // Map table_name back to table for compatibility
      return configurations.map(config => ({
        ...config,
        table: config.table_name
      })) as LocalConfiguration[];
    } catch (error) {
      console.error('Error getting all configurations:', error);
      throw SQLiteErrorMapper.mapError(error, 'getAllConfigurations', 'SELECT');
    }
  }

  async getConfigurationById(id: string, tenantId: string): Promise<LocalConfiguration | null> {
    try {
      const configuration = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE id = ? AND tenantid = ? AND isdeleted = 0',
        [id, tenantId]
      ) as any | null;
      
      if (configuration) {
        // Map table_name back to table for compatibility
        configuration.table = configuration.table_name;
      }
      
      return configuration as LocalConfiguration | null;
    } catch (error) {
      console.error('Error getting configuration by id:', error);
      throw SQLiteErrorMapper.mapError(error, 'getConfigurationById', 'SELECT');
    }
  }

  async getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<LocalConfiguration | null> {
    try {
      const configuration = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE "table" = ? AND type = ? AND key = ? AND tenantid = ? AND isdeleted = 0',
        [table, type, key, tenantId]
      ) as any | null;
      
      if (configuration) {
        // Map table_name back to table for compatibility
        configuration.table = configuration.table_name;
      }
      
      return configuration as LocalConfiguration | null;
    } catch (error) {
      console.error('Error getting configuration:', error);
      throw SQLiteErrorMapper.mapError(error, 'getConfiguration', 'SELECT');
    }
  }

  async createConfiguration(configData: ConfigurationInsert): Promise<LocalConfiguration> {
    try {
      const configuration: LocalConfiguration = {
        id: configData.id || uuidv4(),
        tenantid: configData.tenantid || null,
        key: configData.key,
        table: configData.table,
        type: configData.type,
        value: configData.value,
        isdeleted: configData.isdeleted || false,
        createdat: configData.createdat || new Date().toISOString(),
        createdby: configData.createdby || null,
        updatedat: configData.updatedat || new Date().toISOString(),
        updatedby: configData.updatedby || null
      };

      await this.db.runAsync(
        `INSERT INTO configurations (
          id, tenantid, key, table_name, type, value, isdeleted, 
          createdat, createdby, updatedat, updatedby
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          configuration.id, configuration.tenantid, configuration.key, configuration.table,
          configuration.type, configuration.value, configuration.isdeleted ? 1 : 0,
          configuration.createdat, configuration.createdby, configuration.updatedat,
          configuration.updatedby
        ]
      );

      return configuration;
    } catch (error) {
      console.error('Error creating configuration:', error);
      throw new StorageError('Failed to create configuration', 'CREATE_CONFIGURATION_ERROR', error);
    }
  }

  async updateConfiguration(configData: ConfigurationUpdate): Promise<LocalConfiguration> {
    try {
      if (!configData.id) {
        throw new StorageError('Configuration ID is required for update', 'MISSING_ID_ERROR');
      }

      // Get current configuration to merge with updates
      const currentConfig = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE id = ?',
        [configData.id]
      ) as any;

      if (!currentConfig) {
        throw new StorageError('Configuration not found', 'CONFIGURATION_NOT_FOUND');
      }

      // Map table_name back to table for compatibility
      currentConfig.table = currentConfig.table_name;

      const updatedConfiguration: LocalConfiguration = {
        ...currentConfig,
        ...configData,
        updatedat: new Date().toISOString()
      };

      await this.db.runAsync(
        `UPDATE configurations SET 
          tenantid = ?, key = ?, table_name = ?, type = ?, value = ?, 
          isdeleted = ?, updatedat = ?, updatedby = ?
        WHERE id = ?`,
        [
          updatedConfiguration.tenantid, updatedConfiguration.key, updatedConfiguration.table,
          updatedConfiguration.type, updatedConfiguration.value, updatedConfiguration.isdeleted ? 1 : 0,
          updatedConfiguration.updatedat, updatedConfiguration.updatedby, updatedConfiguration.id
        ]
      );

      return updatedConfiguration;
    } catch (error) {
      console.error('Error updating configuration:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to update configuration', 'UPDATE_CONFIGURATION_ERROR', error);
    }
  }

  async deleteConfiguration(id: string, userId?: string): Promise<LocalConfiguration> {
    try {
      const configuration = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE id = ?',
        [id]
      ) as any;

      if (!configuration) {
        throw new StorageError('Configuration not found', 'CONFIGURATION_NOT_FOUND');
      }

      // Map table_name back to table for compatibility
      configuration.table = configuration.table_name;

      const deletedConfiguration: LocalConfiguration = {
        ...configuration,
        isdeleted: true,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE configurations SET isdeleted = 1, updatedat = ?, updatedby = ? WHERE id = ?',
        [deletedConfiguration.updatedat, deletedConfiguration.updatedby, id]
      );

      return deletedConfiguration;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to delete configuration', 'DELETE_CONFIGURATION_ERROR', error);
    }
  }

  async restoreConfiguration(id: string, userId?: string): Promise<LocalConfiguration> {
    try {
      const configuration = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE id = ?',
        [id]
      ) as any;

      if (!configuration) {
        throw new StorageError('Configuration not found', 'CONFIGURATION_NOT_FOUND');
      }

      // Map table_name back to table for compatibility
      configuration.table = configuration.table_name;

      const restoredConfiguration: LocalConfiguration = {
        ...configuration,
        isdeleted: false,
        updatedat: new Date().toISOString(),
        updatedby: userId || null
      };

      await this.db.runAsync(
        'UPDATE configurations SET isdeleted = 0, updatedat = ?, updatedby = ? WHERE id = ?',
        [restoredConfiguration.updatedat, restoredConfiguration.updatedby, id]
      );

      return restoredConfiguration;
    } catch (error) {
      console.error('Error restoring configuration:', error);
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to restore configuration', 'RESTORE_CONFIGURATION_ERROR', error);
    }
  }
}

export const sqliteConfigurationProvider = new SQLiteConfigurationProvider();