// Mock implementation for Configurations API

import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IConfigurationProvider } from "@/src/types/storage/providers/IConfigurationProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";
import { configurations, validateReferentialIntegrity } from "./mockDataStore";

export class MockConfigurationProvider implements IConfigurationProvider {
  readonly mode: StorageMode = StorageMode.Demo;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getAllConfigurations(tenantId: string): Promise<Configuration[]> {
    return withStorageErrorHandling(
      async () => {
        return configurations.filter(conf => (conf.tenantid === tenantId || tenantId === "demo") && !conf.isdeleted);
      },
      {
        storageMode: "demo",
        operation: "getAllConfigurations",
        table: "configurations",
        tenantId,
      },
    );
  }

  async getConfigurationById(id: string, tenantId: string): Promise<Configuration | null> {
    return withStorageErrorHandling(
      async () => {
        return (
          configurations.find(
            conf => conf.id === id && (conf.tenantid === tenantId || tenantId === "demo") && !conf.isdeleted,
          ) ?? null
        );
      },
      {
        storageMode: "demo",
        operation: "getConfigurationById",
        table: "configurations",
        recordId: id,
        tenantId,
      },
    );
  }

  async getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<Configuration | null> {
    return withStorageErrorHandling(
      async () => {
        return (
          configurations.find(
            conf =>
              conf.table.toLowerCase() === table.toLowerCase() &&
              conf.type.toLowerCase() === type.toLowerCase() &&
              conf.key.toLowerCase() === key.toLowerCase() &&
              (conf.tenantid === tenantId || tenantId === "demo") &&
              !conf.isdeleted,
          ) ?? null
        );
      },
      {
        storageMode: "demo",
        operation: "getConfiguration",
        table: "configurations",
        tenantId,
      },
    );
  }

  async createConfiguration(configuration: Inserts<TableNames.Configurations>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate unique constraint for table + type + key combination
        validateReferentialIntegrity.validateUniqueConfigurationKey(
          configuration.key,
          configuration.table,
          configuration.tenantid || "demo",
        );

        const newConfiguration = {
          ...configuration,
          id: `conf-${Date.now()}`,
          isdeleted: false,
          createdat: new Date().toISOString(),
          createdby: configuration.createdby || "demo",
          updatedat: null,
          updatedby: null,
          tenantid: configuration.tenantid || "demo",
        };

        configurations.push(newConfiguration);
        return newConfiguration;
      },
      {
        storageMode: "demo",
        operation: "createConfiguration",
        table: "configurations",
        tenantId: configuration.tenantid || undefined,
      },
    );
  }

  async updateConfiguration(configuration: Updates<TableNames.Configurations>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = configurations.findIndex(conf => conf.id === configuration.id);
        if (index === -1) {
          throw new Error("Configuration not found");
        }

        // Validate unique constraint if key fields are being updated
        if (configuration.table || configuration.type || configuration.key) {
          const currentConf = configurations[index];
          validateReferentialIntegrity.validateUniqueConfigurationKey(
            configuration.key || currentConf.key,
            configuration.table || currentConf.table,
            currentConf.tenantid || "demo",
            configuration.id,
          );
        }

        configurations[index] = {
          ...configurations[index],
          ...configuration,
          updatedat: new Date().toISOString(),
        };

        return configurations[index];
      },
      {
        storageMode: "demo",
        operation: "updateConfiguration",
        table: "configurations",
        recordId: configuration.id,
        tenantId: configuration.tenantid || undefined,
      },
    );
  }

  async deleteConfiguration(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = configurations.findIndex(conf => conf.id === id);
        if (index === -1) {
          throw new Error("Configuration not found");
        }

        configurations[index].isdeleted = true;
        configurations[index].updatedby = userId ?? "demo";
        configurations[index].updatedat = new Date().toISOString();

        return configurations[index];
      },
      {
        storageMode: "demo",
        operation: "deleteConfiguration",
        table: "configurations",
        recordId: id,
      },
    );
  }

  async restoreConfiguration(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = configurations.findIndex(conf => conf.id === id);
        if (index === -1) {
          throw new Error("Configuration not found");
        }

        configurations[index].isdeleted = false;
        configurations[index].updatedby = userId ?? "demo";
        configurations[index].updatedat = new Date().toISOString();

        return configurations[index];
      },
      {
        storageMode: "demo",
        operation: "restoreConfiguration",
        table: "configurations",
        recordId: id,
      },
    );
  }

  async getConfigurationsByTable(tenantId: string, table: string): Promise<Configuration[]> {
    return withStorageErrorHandling(
      async () => {
        return configurations.filter(
          conf =>
            conf.table.toLowerCase() === table.toLowerCase() &&
            (conf.tenantid === tenantId || tenantId === "demo") &&
            !conf.isdeleted,
        );
      },
      {
        storageMode: "demo",
        operation: "getConfigurationsByTable",
        table: "configurations",
        tenantId,
      },
    );
  }
}

// Export provider instance
export const mockConfigurationProvider = new MockConfigurationProvider();

// Legacy function exports for backward compatibility
export const getAllConfigurations = (tenantId: string) => mockConfigurationProvider.getAllConfigurations(tenantId);
export const getConfigurationById = (id: string, tenantId: string) =>
  mockConfigurationProvider.getConfigurationById(id, tenantId);
export const getConfiguration = (table: string, type: string, key: string, tenantId: string) =>
  mockConfigurationProvider.getConfiguration(table, type, key, tenantId);
export const createConfiguration = (configuration: Inserts<TableNames.Configurations>) =>
  mockConfigurationProvider.createConfiguration(configuration);
export const updateConfiguration = (configuration: Updates<TableNames.Configurations>) =>
  mockConfigurationProvider.updateConfiguration(configuration);
export const deleteConfiguration = (id: string, userId?: string) =>
  mockConfigurationProvider.deleteConfiguration(id, userId);
export const restoreConfiguration = (id: string, userId?: string) =>
  mockConfigurationProvider.restoreConfiguration(id, userId);
export const getConfigurationsByTable = (tenantId: string, table: string) =>
  mockConfigurationProvider.getConfigurationsByTable(tenantId, table);
