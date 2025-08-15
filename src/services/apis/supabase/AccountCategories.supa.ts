import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IAccountCategoryProvider } from "@/src/types/storage/providers/IAccountCategoryProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

export class SupabaseAccountCategoryProvider implements IAccountCategoryProvider {
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

  async getAllAccountCategories(tenantId: string): Promise<AccountCategory[]> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
          .select()
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .order("displayorder", { ascending: false })
          .order("name");

        if (error) {
          throw new NetworkError(error.message, {
            operation: "getAllAccountCategories",
            table: "accountcategories",
            tenantId,
          });
        }

        return data as AccountCategory[];
      },
      {
        storageMode: "cloud",
        operation: "getAllAccountCategories",
        table: "accountcategories",
        tenantId,
      },
    );
  }

  async getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
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
            operation: "getAccountCategoryById",
            table: "accountcategories",
            recordId: id,
            tenantId,
          });
        }

        return data as AccountCategory;
      },
      {
        storageMode: "cloud",
        operation: "getAccountCategoryById",
        table: "accountcategories",
        recordId: id,
        tenantId,
      },
    );
  }

  async createAccountCategory(accountCategory: Inserts<TableNames.AccountCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
          .insert(accountCategory)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createAccountCategory",
            table: "accountcategories",
            data: accountCategory,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createAccountCategory",
        table: "accountcategories",
      },
    );
  }

  async updateAccountCategory(accountCategory: Updates<TableNames.AccountCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
          .update({ ...accountCategory })
          .eq("id", accountCategory.id!)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateAccountCategory",
            table: "accountcategories",
            recordId: accountCategory.id,
            data: accountCategory,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "updateAccountCategory",
        table: "accountcategories",
        recordId: accountCategory.id,
      },
    );
  }

  async deleteAccountCategory(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
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
            operation: "deleteAccountCategory",
            table: "accountcategories",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "deleteAccountCategory",
        table: "accountcategories",
        recordId: id,
      },
    );
  }

  async restoreAccountCategory(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.AccountCategories)
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
            operation: "restoreAccountCategory",
            table: "accountcategories",
            recordId: id,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "restoreAccountCategory",
        table: "accountcategories",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const supabaseAccountCategoryProvider = new SupabaseAccountCategoryProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const getAllAccountCategories = supabaseAccountCategoryProvider.getAllAccountCategories.bind(
  supabaseAccountCategoryProvider,
);
export const getAccountCategoryById = supabaseAccountCategoryProvider.getAccountCategoryById.bind(
  supabaseAccountCategoryProvider,
);
export const createAccountCategory = supabaseAccountCategoryProvider.createAccountCategory.bind(
  supabaseAccountCategoryProvider,
);
export const updateAccountCategory = supabaseAccountCategoryProvider.updateAccountCategory.bind(
  supabaseAccountCategoryProvider,
);
export const deleteAccountCategory = supabaseAccountCategoryProvider.deleteAccountCategory.bind(
  supabaseAccountCategoryProvider,
);
export const restoreAccountCategory = supabaseAccountCategoryProvider.restoreAccountCategory.bind(
  supabaseAccountCategoryProvider,
);
