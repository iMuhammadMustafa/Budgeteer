import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { ITransactionCategoryProvider } from "@/src/types/storage/providers/ITransactionCategoryProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseTransactionCategoryProvider implements ITransactionCategoryProvider {
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

  async getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
          .select(`*, group:${TableNames.TransactionGroups}!transactioncategories_groupid_fkey(*)`)
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .order("displayorder", { ascending: false })
          .order("group(displayorder)", { ascending: false })
          .order("name");

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getAllTransactionCategories",
            table: "transactioncategories",
            tenantId,
          });
        }

        return data as TransactionCategory[];
      },
      {
        storageMode: "cloud",
        operation: "getAllTransactionCategories",
        table: "transactioncategories",
        tenantId,
      },
    );
  }

  async getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
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
            operation: "getTransactionCategoryById",
            table: "transactioncategories",
            recordId: id,
            tenantId,
          });
        }

        return data as TransactionCategory;
      },
      {
        storageMode: "cloud",
        operation: "getTransactionCategoryById",
        table: "transactioncategories",
        recordId: id,
        tenantId,
      },
    );
  }

  async createTransactionCategory(
    transactionCategory: Inserts<TableNames.TransactionCategories>,
  ): Promise<TransactionCategory> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
          .insert(transactionCategory)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createTransactionCategory",
            table: "transactioncategories",
            data: transactionCategory,
          });
        }

        return data as TransactionCategory;
      },
      {
        storageMode: "cloud",
        operation: "createTransactionCategory",
        table: "transactioncategories",
      },
    );
  }

  async updateTransactionCategory(
    transactionCategory: Updates<TableNames.TransactionCategories>,
  ): Promise<TransactionCategory> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
          .update({ ...transactionCategory })
          .eq("id", transactionCategory.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateTransactionCategory",
            table: "transactioncategories",
            recordId: transactionCategory.id,
            data: transactionCategory,
          });
        }

        return data as TransactionCategory;
      },
      {
        storageMode: "cloud",
        operation: "updateTransactionCategory",
        table: "transactioncategories",
        recordId: transactionCategory.id,
      },
    );
  }

  async deleteTransactionCategory(id: string, userId: string): Promise<TransactionCategory> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
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
            operation: "deleteTransactionCategory",
            table: "transactioncategories",
            recordId: id,
            userId,
          });
        }

        return data as TransactionCategory;
      },
      {
        storageMode: "cloud",
        operation: "deleteTransactionCategory",
        table: "transactioncategories",
        recordId: id,
      },
    );
  }

  async restoreTransactionCategory(id: string, userId: string): Promise<TransactionCategory> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
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
            operation: "restoreTransactionCategory",
            table: "transactioncategories",
            recordId: id,
            userId,
          });
        }

        return data as TransactionCategory;
      },
      {
        storageMode: "cloud",
        operation: "restoreTransactionCategory",
        table: "transactioncategories",
        recordId: id,
      },
    );
  }

  async getTransactionCategoriesByGroup(tenantId: string, groupId: string): Promise<TransactionCategory[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.TransactionCategories)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("groupid", groupId)
          .order("displayorder", { ascending: false })
          .order("name");

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getTransactionCategoriesByGroup",
            table: "transactioncategories",
            tenantId,
            groupId,
          });
        }

        return data as TransactionCategory[];
      },
      {
        storageMode: "cloud",
        operation: "getTransactionCategoriesByGroup",
        table: "transactioncategories",
        tenantId,
      },
    );
  }
}

// Export provider instance
export const supabaseTransactionCategoryProvider = new SupabaseTransactionCategoryProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getAllTransactionCategories = supabaseTransactionCategoryProvider.getAllTransactionCategories.bind(
  supabaseTransactionCategoryProvider,
);
export const getTransactionCategoryById = supabaseTransactionCategoryProvider.getTransactionCategoryById.bind(
  supabaseTransactionCategoryProvider,
);
export const createTransactionCategory = supabaseTransactionCategoryProvider.createTransactionCategory.bind(
  supabaseTransactionCategoryProvider,
);
export const updateTransactionCategory = supabaseTransactionCategoryProvider.updateTransactionCategory.bind(
  supabaseTransactionCategoryProvider,
);
export const deleteTransactionCategory = supabaseTransactionCategoryProvider.deleteTransactionCategory.bind(
  supabaseTransactionCategoryProvider,
);
export const restoreTransactionCategory = supabaseTransactionCategoryProvider.restoreTransactionCategory.bind(
  supabaseTransactionCategoryProvider,
);
