import { db, LocalConfiguration } from './BudgeteerDatabase';
import { Configuration, Inserts, Updates } from '../../../types/db/Tables.Types';
import { TableNames } from '../../../types/db/TableNames';
import { 
  StorageError, 
  StorageErrorCode, 
  RecordNotFoundError 
} from '../../storage/errors/StorageErrors';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllConfigurations = async (tenantId: string): Promise<Configuration[]> => {
  return await db.safeQuery(
    async () => {
      // Use optimized query for optimal performance
      const configurations = await db.configurations
        .where('tenantid')
        .equals(tenantId)
        .and(config => !config.isdeleted)
        .sortBy('createdat');

      return configurations as Configuration[];
    },
    'getAllConfigurations',
    'configurations',
    { tenantId }
  );
};

export const getConfigurationById = async (id: string, tenantId: string): Promise<Configuration | null> => {
  return await db.safeQuery(
    async () => {
      const configuration = await db.configurations
        .where('id')
        .equals(id)
        .and(config => config.tenantid === tenantId && !config.isdeleted)
        .first();

      return configuration as Configuration || null;
    },
    'getConfigurationById',
    'configurations',
    { id, tenantId }
  );
};

export const createConfiguration = async (configuration: Inserts<TableNames.Configurations>) => {
  return await db.safeQuery(
    async () => {
      const newConfiguration: LocalConfiguration = {
        id: configuration.id || uuidv4(),
        tenantid: configuration.tenantid || null,
        key: configuration.key,
        table: configuration.table,
        type: configuration.type,
        value: configuration.value,
        isdeleted: configuration.isdeleted || false,
        createdat: configuration.createdat || new Date().toISOString(),
        createdby: configuration.createdby || null,
        updatedat: configuration.updatedat || new Date().toISOString(),
        updatedby: configuration.updatedby || null
      };

      await db.configurations.add(newConfiguration);
      return newConfiguration;
    },
    'createConfiguration',
    'configurations',
    { configurationData: configuration }
  );
};

export const updateConfiguration = async (configuration: Updates<TableNames.Configurations>) => {
  return await db.safeQuery(
    async () => {
      if (!configuration.id) {
        throw new StorageError(
          'Configuration ID is required for update',
          StorageErrorCode.INVALID_DATA,
          { operation: 'updateConfiguration', table: 'configurations' }
        );
      }

      const updateData = {
        ...configuration,
        updatedat: new Date().toISOString()
      };

      const updateCount = await db.configurations.update(configuration.id, updateData);
      
      if (updateCount === 0) {
        throw new RecordNotFoundError('configurations', configuration.id, {
          operation: 'updateConfiguration'
        });
      }
      
      const updatedConfiguration = await db.configurations.get(configuration.id);
      return updatedConfiguration;
    },
    'updateConfiguration',
    'configurations',
    { configurationId: configuration.id }
  );
};

export const deleteConfiguration = async (id: string, userId?: string) => {
  return await db.safeQuery(
    async () => {
      const updateData = {
        isdeleted: true,
        updatedby: userId || null,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
      };

      const updateCount = await db.configurations.update(id, updateData);
      
      if (updateCount === 0) {
        throw new RecordNotFoundError('configurations', id, {
          operation: 'deleteConfiguration'
        });
      }
      
      const deletedConfiguration = await db.configurations.get(id);
      return deletedConfiguration;
    },
    'deleteConfiguration',
    'configurations',
    { configurationId: id, userId }
  );
};

export const restoreConfiguration = async (id: string, userId?: string) => {
  return await db.safeQuery(
    async () => {
      const updateData = {
        isdeleted: false,
        updatedby: userId || null,
        updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
      };

      const updateCount = await db.configurations.update(id, updateData);
      
      if (updateCount === 0) {
        throw new RecordNotFoundError('configurations', id, {
          operation: 'restoreConfiguration'
        });
      }
      
      const restoredConfiguration = await db.configurations.get(id);
      return restoredConfiguration;
    },
    'restoreConfiguration',
    'configurations',
    { configurationId: id, userId }
  );
};