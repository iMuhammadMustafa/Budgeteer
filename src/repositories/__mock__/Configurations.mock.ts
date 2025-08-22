// Mock implementation for Configurations API

import { Configuration } from "@/src/types/db/Tables.Types";
import { configurations } from "./mockDataStore";

export const getAllConfigurations = async (tenantId: string): Promise<Configuration[]> => {
  return configurations.filter(conf => conf.tenantid === tenantId || tenantId === "demo");
};

export const getConfigurationById = async (id: string, tenantId: string): Promise<Configuration | null> => {
  return configurations.find(conf => conf.id === id && (conf.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const getConfiguration = async (
  table: string,
  type: string,
  key: string,
  tenantId: string,
): Promise<Configuration | null> => {
  return (
    configurations.find(
      conf =>
        conf.table === table &&
        conf.type === type &&
        conf.key === key &&
        (conf.tenantid === tenantId || tenantId === "demo"),
    ) ?? null
  );
};

export const createConfiguration = async (configuration: any) => {
  if (
    configurations.some(
      conf =>
        conf.key === configuration.key &&
        conf.table === configuration.table &&
        conf.tenantid === configuration.tenantid &&
        !conf.isdeleted,
    )
  ) {
    throw new Error("Configuration key already exists for this table");
  }
  const newConfig = {
    ...configuration,
    id: `conf-${Date.now()}`,
    createdat: new Date().toISOString(),
    isdeleted: false,
    updatedat: null,
    updatedby: null,
  };
  configurations.push(newConfig);
  return newConfig;
};

export const updateConfiguration = async (configuration: any) => {
  const idx = configurations.findIndex(conf => conf.id === configuration.id);
  if (idx === -1) throw new Error("Configuration not found");
  configurations[idx] = { ...configurations[idx], ...configuration };
  return configurations[idx];
};

export const deleteConfiguration = async (id: string, userId: string) => {
  const idx = configurations.findIndex(conf => conf.id === id);
  if (idx === -1) throw new Error("Configuration not found");
  configurations[idx].isdeleted = true;
  configurations[idx].updatedby = userId ?? "demo";
  configurations[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreConfiguration = async (id: string, userId: string) => {
  const idx = configurations.findIndex(conf => conf.id === id);
  if (idx === -1) throw new Error("Configuration not found");
  configurations[idx].isdeleted = false;
  configurations[idx].updatedby = userId ?? "demo";
  configurations[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};
