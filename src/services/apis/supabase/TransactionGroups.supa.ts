import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { ITransactionGroupProvider } from "@/src/types/storage/providers/ITransactionGroupProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseTransactionGroupProvider implements ITransactionGroupProvider {
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

  async getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .order("displayorder", { ascending: false })
          .order("name");

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getAllTransactionGroups",
            table: "transactiongroups",
            tenantId,
          });
        }

        return data as TransactionGroup[];
      },
      {
        storageMode: "cloud",
        operation: "getAllTransactionGroups",
        table: "transactiongroups",
        tenantId,
      },
    );
  }

  async getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
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
            operation: "getTransactionGroupById",
            table: "transactiongroups",
            recordId: id,
            tenantId,
          });
        }

        return data as TransactionGroup;
      },
      {
        storageMode: "cloud",
        operation: "getTransactionGroupById",
        table: "transactiongroups",
        recordId: id,
        tenantId,
      },
    );
  }

  async createTransactionGroup(transactionGroup: Inserts<TableNames.TransactionGroups>): Promise<TransactionGroup> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
          .insert(transactionGroup)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createTransactionGroup",
            table: "transactiongroups",
            data: transactionGroup,
          });
        }

        return data as TransactionGroup;
      },
      {
        storageMode: "cloud",
        operation: "createTransactionGroup",
        table: "transactiongroups",
      },
    );
  }

  async updateTransactionGroup(transactionGroup: Updates<TableNames.TransactionGroups>): Promise<TransactionGroup> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
          .update({ ...transactionGroup })
          .eq("id", transactionGroup.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateTransactionGroup",
            table: "transactiongroups",
            recordId: transactionGroup.id,
            data: transactionGroup,
          });
        }

        return data as TransactionGroup;
      },
      {
        storageMode: "cloud",
        operation: "updateTransactionGroup",
        table: "transactiongroups",
        recordId: transactionGroup.id,
      },
    );
  }

  async deleteTransactionGroup(id: string, userId: string): Promise<TransactionGroup> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
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
            operation: "deleteTransactionGroup",
            table: "transactiongroups",
            recordId: id,
            userId,
          });
        }

        return data as TransactionGroup;
      },
      {
        storageMode: "cloud",
        operation: "deleteTransactionGroup",
        table: "transactiongroups",
        recordId: id,
      },
    );
  }

  async restoreTransactionGroup(id: string, userId: string): Promise<TransactionGroup> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionGroups)
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
            operation: "restoreTransactionGroup",
            table: "transactiongroups",
            recordId: id,
            userId,
          });
        }

        return data as TransactionGroup;
      },
      {
        storageMode: "cloud",
        operation: "restoreTransactionGroup",
        table: "transactiongroups",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const supabaseTransactionGroupProvider = new SupabaseTransactionGroupProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getAllTransactionGroups = supabaseTransactionGroupProvider.getAllTransactionGroups.bind(
  supabaseTransactionGroupProvider,
);
export const getTransactionGroupById = supabaseTransactionGroupProvider.getTransactionGroupById.bind(
  supabaseTransactionGroupProvider,
);
export const createTransactionGroup = supabaseTransactionGroupProvider.createTransactionGroup.bind(
  supabaseTransactionGroupProvider,
);
export const updateTransactionGroup = supabaseTransactionGroupProvider.updateTransactionGroup.bind(
  supabaseTransactionGroupProvider,
);
export const deleteTransactionGroup = supabaseTransactionGroupProvider.deleteTransactionGroup.bind(
  supabaseTransactionGroupProvider,
);
export const restoreTransactionGroup = supabaseTransactionGroupProvider.restoreTransactionGroup.bind(
  supabaseTransactionGroupProvider,
);
