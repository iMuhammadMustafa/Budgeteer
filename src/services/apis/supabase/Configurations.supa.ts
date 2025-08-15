// Real implementation moved from Configurations.api.ts
import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Configuration, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IConfigurationProvider } from "@/src/types/storage/providers/IConfigurationProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseConfigurationProvider implements IConfigurationProvider {
  readonly mode: StorageMode = StorageMode.Cloud;
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
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getAllConfigurations",
            table: "configurations",
            tenantId,
          });
        }

        return data as Configuration[];
      },
      {
        storageMode: "cloud",
        operation: "getAllConfigurations",
        table: "configurations",
        tenantId,
      },
    );
  }

  async getConfigurationById(id: string, tenantId: string): Promise<Configuration | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("id", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getConfigurationById",
            table: "configurations",
            recordId: id,
            tenantId,
          });
        }

        return data as Configuration;
      },
      {
        storageMode: "cloud",
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
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .ilike('"table"', table)
          .ilike("type", type)
          .ilike("key", key)
          .limit(1)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getConfiguration",
            table: "configurations",
            tenantId,
            searchCriteria: { table, type, key },
          });
        }

        return data as Configuration;
      },
      {
        storageMode: "cloud",
        operation: "getConfiguration",
        table: "configurations",
        tenantId,
      },
    );
  }

  async createConfiguration(configuration: Inserts<TableNames.Configurations>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase.from(TableNames.Configurations).insert(configuration).select().single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createConfiguration",
            table: "configurations",
            data: configuration,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createConfiguration",
        table: "configurations",
      },
    );
  }

  async updateConfiguration(configuration: Updates<TableNames.Configurations>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .update({ ...configuration })
          .eq("id", configuration.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateConfiguration",
            table: "configurations",
            recordId: configuration.id,
            data: configuration,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "updateConfiguration",
        table: "configurations",
        recordId: configuration.id,
      },
    );
  }

  async deleteConfiguration(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .update({
            isdeleted: true,
            updatedby: userId,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "deleteConfiguration",
            table: "configurations",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "deleteConfiguration",
        table: "configurations",
        recordId: id,
      },
    );
  }

  async restoreConfiguration(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .update({
            isdeleted: false,
            updatedby: userId,
            updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "restoreConfiguration",
            table: "configurations",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "restoreConfiguration",
        table: "configurations",
        recordId: id,
      },
    );
  }

  async getConfigurationsByTable(tenantId: string, table: string): Promise<Configuration[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Configurations)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .ilike('"table"', table);

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getConfigurationsByTable",
            table: "configurations",
            tenantId,
            filterTable: table,
          });
        }

        return data as Configuration[];
      },
      {
        storageMode: "cloud",
        operation: "getConfigurationsByTable",
        table: "configurations",
        tenantId,
      },
    );
  }
}

// Export provider instance
export const supabaseConfigurationProvider = new SupabaseConfigurationProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getAllConfigurations =
  supabaseConfigurationProvider.getAllConfigurations.bind(supabaseConfigurationProvider);
export const getConfigurationById =
  supabaseConfigurationProvider.getConfigurationById.bind(supabaseConfigurationProvider);
export const getConfiguration = supabaseConfigurationProvider.getConfiguration.bind(supabaseConfigurationProvider);
export const createConfiguration =
  supabaseConfigurationProvider.createConfiguration.bind(supabaseConfigurationProvider);
export const updateConfiguration =
  supabaseConfigurationProvider.updateConfiguration.bind(supabaseConfigurationProvider);
export const deleteConfiguration =
  supabaseConfigurationProvider.deleteConfiguration.bind(supabaseConfigurationProvider);
export const restoreConfiguration =
  supabaseConfigurationProvider.restoreConfiguration.bind(supabaseConfigurationProvider);
