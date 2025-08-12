import { db, LocalConfiguration } from './BudgeteerDatabase';
// Configurations local storage provider
import { Configuration, Inserts, Updates } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllConfigurations = async (tenantId: string): Promise<Configuration[]> => {
  try {
    const configurations = await db.configurations
      .where('tenantid')
      .equals(tenantId)
      .and(config => !config.isdeleted)
      .orderBy('createdat')
      .toArray();

    return configurations as Configuration[];
  } catch (error) {
    throw new Error(`Failed to get configurations: ${error}`);
  }
};

export const getConfigurationById = async (id: string, tenantId: string): Promise<Configuration | null> => {
  try {
    const configuration = await db.configurations
      .where('id')
      .equals(id)
      .and(config => config.tenantid === tenantId && !config.isdeleted)
      .first();

    return configuration as Configuration || null;
  } catch (error) {
    throw new Error(`Failed to get configuration by id: ${error}`);
  }
};

export const createConfiguration = async (configuration: Inserts<TableNames.Configurations>) => {
  try {
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
  } catch (error) {
    throw new Error(`Failed to create configuration: ${error}`);
  }
};

export const updateConfiguration = async (configuration: Updates<TableNames.Configurations>) => {
  try {
    if (!configuration.id) {
      throw new Error('Configuration ID is required for update');
    }

    const updateData = {
      ...configuration,
      updatedat: new Date().toISOString()
    };

    await db.configurations.update(configuration.id, updateData);
    
    const updatedConfiguration = await db.configurations.get(configuration.id);
    return updatedConfiguration;
  } catch (error) {
    throw new Error(`Failed to update configuration: ${error}`);
  }
};

export const deleteConfiguration = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: true,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.configurations.update(id, updateData);
    
    const deletedConfiguration = await db.configurations.get(id);
    return deletedConfiguration;
  } catch (error) {
    throw new Error(`Failed to delete configuration: ${error}`);
  }
};

export const restoreConfiguration = async (id: string, userId?: string) => {
  try {
    const updateData = {
      isdeleted: false,
      updatedby: userId || null,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ")
    };

    await db.configurations.update(id, updateData);
    
    const restoredConfiguration = await db.configurations.get(id);
    return restoredConfiguration;
  } catch (error) {
    throw new Error(`Failed to restore configuration: ${error}`);
  }
};