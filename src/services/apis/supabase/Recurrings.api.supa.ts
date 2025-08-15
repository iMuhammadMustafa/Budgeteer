// Real implementation moved from Recurrings.api.ts
import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IRecurringProvider } from "@/src/types/storage/providers/IRecurringProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import {
  StorageError,
  StorageErrorCode,
  NetworkError,
  RecordNotFoundError,
  withStorageErrorHandling,
} from "@/src/services/storage/errors";

// Define the parameter types used in the actual implementation
type ListRecurringsParams = {
  tenantId: string;
  filters?: any;
};

export class SupabaseRecurringProvider implements IRecurringProvider {
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

  async listRecurrings(params: ListRecurringsParams): Promise<Recurring[]> {
    return withStorageErrorHandling(
      async () => {
        let query = supabase
          .from(TableNames.Recurrings)
          .select(
            `*, 
             source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
             category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
          )
          .eq("tenantid", params.tenantId)
          .eq("isdeleted", false);

        if (params.filters) {
          // Example: apply filters if provided
          // if (params.filters.isactive !== undefined) {
          //   query = query.eq("isactive", params.filters.isactive);
          // }
        }

        query = query.order("nextoccurrencedate").order("name");

        const { data, error } = await query;

        if (error) {
          throw new NetworkError(error.message, {
            operation: "listRecurrings",
            table: "recurrings",
            tenantId: params.tenantId,
            filters: params.filters,
          });
        }

        return data as unknown as Recurring[];
      },
      {
        storageMode: "cloud",
        operation: "listRecurrings",
        table: "recurrings",
        tenantId: params.tenantId,
      },
    );
  }

  async getRecurringById(id: string, tenantId: string): Promise<Recurring | null> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Recurrings)
          .select(
            `*, 
             source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
             category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
          )
          .eq("tenantid", tenantId)
          .eq("isdeleted", false)
          .eq("id", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return null; // Record not found
          }
          throw new NetworkError(error.message, {
            operation: "getRecurringById",
            table: "recurrings",
            recordId: id,
            tenantId,
          });
        }

        return data as unknown as Recurring | null;
      },
      {
        storageMode: "cloud",
        operation: "getRecurringById",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }

  async createRecurring(recurringData: Inserts<TableNames.Recurrings>, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Recurrings)
          .insert({ ...recurringData, tenantid: tenantId })
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "createRecurring",
            table: "recurrings",
            data: recurringData,
            tenantId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "createRecurring",
        table: "recurrings",
        tenantId,
      },
    );
  }

  async updateRecurring(id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Recurrings)
          .update({ ...recurringData, updatedat: dayjs().toISOString() })
          .eq("id", id)
          .eq("tenantid", tenantId)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "updateRecurring",
            table: "recurrings",
            recordId: id,
            data: recurringData,
            tenantId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "updateRecurring",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }

  async deleteRecurring(id: string, tenantId: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from(TableNames.Recurrings)
          .update({
            isdeleted: true,
            updatedby: userId ?? undefined,
            updatedat: dayjs().toISOString(),
          })
          .eq("id", id)
          .eq("tenantid", tenantId)
          .select()
          .single();

        if (error) {
          throw new NetworkError(error.message, {
            operation: "deleteRecurring",
            table: "recurrings",
            recordId: id,
            tenantId,
            userId,
          });
        }

        return data;
      },
      {
        storageMode: "cloud",
        operation: "deleteRecurring",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }
}

// Export provider instance
export const supabaseRecurringProvider = new SupabaseRecurringProvider();

// Legacy exports for backward compatibility (can be removed once all code is updated)
export const listRecurrings = supabaseRecurringProvider.listRecurrings.bind(supabaseRecurringProvider);
export const getRecurringById = supabaseRecurringProvider.getRecurringById.bind(supabaseRecurringProvider);
export const createRecurring = supabaseRecurringProvider.createRecurring.bind(supabaseRecurringProvider);
export const updateRecurring = supabaseRecurringProvider.updateRecurring.bind(supabaseRecurringProvider);
export const deleteRecurring = supabaseRecurringProvider.deleteRecurring.bind(supabaseRecurringProvider);
