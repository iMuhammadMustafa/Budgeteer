import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";

// Define DTOs based on the 'recurrings' table structure
// These DTOs will automatically include the 'type' field (e.g., "Expense", "Income", "Transfer")
// once the Recurring type in Tables.Types.ts is updated to reflect the database schema.
export type CreateRecurringDto = Inserts<TableNames.Recurrings>;
export type UpdateRecurringDto = Updates<TableNames.Recurrings>;

export const listRecurrings = async (params: { tenantId: string; filters?: any }): Promise<Recurring[]> => {
  let query = supabase
    .from(TableNames.Recurrings)
    .select(
      `*, 
       source_account:${TableNames.Accounts}!recurrings_source_account_id_fkey(*), 
       category:${TableNames.TransactionCategories}!recurrings_category_id_fkey(*)`,
    )
    .eq("tenantid", params.tenantId) // Lowercase
    .eq("isdeleted", false); // Lowercase

  if (params.filters) {
    // Example: apply filters if provided
    // if (params.filters.isactive !== undefined) { // Lowercase
    //   query = query.eq("isactive", params.filters.isactive); // Lowercase
    // }
  }

  query = query.order("nextoccurrencedate").order("name"); // Lowercase

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as unknown as Recurring[];
};

export const getRecurringById = async (id: string, tenantId: string): Promise<Recurring | null> => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    .select(
      `*, 
       source_account:${TableNames.Accounts}!recurrings_source_account_id_fkey(*), 
       category:${TableNames.TransactionCategories}!recurrings_category_id_fkey(*)`,
    )
    .eq("tenantid", tenantId) // Lowercase
    .eq("isdeleted", false) // Lowercase
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // PostgREST error for "No rows found"
      return null;
    }
    throw new Error(error.message);
  }
  return data as unknown as Recurring | null;
};

export const createRecurring = async (recurringData: CreateRecurringDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    // recurringData (CreateRecurringDto) is already all lowercase.
    // tenantId property added here must also be lowercase.
    .insert({ ...recurringData, tenantid: tenantId }) // Lowercase
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRecurring = async (id: string, recurringData: UpdateRecurringDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    // recurringData (UpdateRecurringDto) is already all lowercase.
    // updatedat property added here is already lowercase.
    .update({ ...recurringData, updatedat: dayjs().toISOString() })
    .eq("id", id)
    .eq("tenantid", tenantId) // Lowercase
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRecurring = async (id: string, tenantId: string, userId?: string) => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    .update({
      // All keys in payload must be lowercase
      isdeleted: true,
      updatedby: userId ?? undefined,
      updatedat: dayjs().toISOString(),
    })
    .eq("id", id)
    .eq("tenantid", tenantId) // Lowercase
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Removed applyRecurringTransaction that calls RPC.
// The repository will now handle the multi-step execution logic.
