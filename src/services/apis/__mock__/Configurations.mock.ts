// Mock implementation for Configurations API

import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { configurations, validateReferentialIntegrity } from "./mockDataStore";

export const getAllConfigurations = async (tenantId: string): Promise<Configuration[]> => {
  return configurations.filter(conf => 
    (conf.tenantid === tenantId || tenantId === "demo") && !conf.isdeleted
  );
};

export const getConfigurationById = async (id: string, tenantId: string): Promise<Configuration | null> => {
  return configurations.find(conf => 
    conf.id === id && 
    (conf.tenantid === tenantId || tenantId === "demo") && 
    !conf.isdeleted
  ) ?? null;
};

export const getConfiguration = async (
  table: string,
  type: string,
  key: string,
  tenantId: string,
): Promise<Configuration | null> => {
  return configurations.find(
    conf =>
      conf.table.toLowerCase() === table.toLowerCase() &&
      conf.type.toLowerCase() === type.toLowerCase() &&
      conf.key.toLowerCase() === key.toLowerCase() &&
      (conf.tenantid === tenantId || tenantId === "demo") &&
      !conf.isdeleted
  ) ?? null;
};

export const createConfiguration = async (configuration: Inserts<TableNames.Configurations>) => {
  // Validate unique constraint
  validateReferentialIntegrity.validateUniqueConfigurationKey(
    configuration.key,
    configuration.table,
    configuration.tenantid || "demo"
  );

  const newConfig = {
    ...configuration,
    id: `conf-${Date.now()}`,
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: configuration.createdby || "demo",
    updatedat: null,
    updatedby: null,
    tenantid: configuration.tenantid || "demo",
  };
  
  configurations.push(newConfig);
  return newConfig;
};

export const updateConfiguration = async (configuration: Updates<TableNames.Configurations>) => {
  const idx = configurations.findIndex(conf => conf.id === configuration.id);
  if (idx === -1) throw new Error("Configuration not found");

  // Validate unique constraint if key or table is being updated
  if (configuration.key || configuration.table) {
    validateReferentialIntegrity.validateUniqueConfigurationKey(
      configuration.key || configurations[idx].key,
      configuration.table || configurations[idx].table,
      configurations[idx].tenantid,
      configuration.id
    );
  }

  configurations[idx] = { 
    ...configurations[idx], 
    ...configuration,
    updatedat: new Date().toISOString(),
  };
  return configurations[idx];
};

export const deleteConfiguration = async (id: string, userId: string) => {
  const idx = configurations.findIndex(conf => conf.id === id);
  if (idx === -1) throw new Error("Configuration not found");
  
  configurations[idx].isdeleted = true;
  configurations[idx].updatedby = userId ?? "demo";
  configurations[idx].updatedat = new Date().toISOString();
  
  return configurations[idx];
};

export const restoreConfiguration = async (id: string, userId: string) => {
  const idx = configurations.findIndex(conf => conf.id === id);
  if (idx === -1) throw new Error("Configuration not found");
  
  configurations[idx].isdeleted = false;
  configurations[idx].updatedby = userId ?? "demo";
  configurations[idx].updatedat = new Date().toISOString();
  
  return configurations[idx];
};
