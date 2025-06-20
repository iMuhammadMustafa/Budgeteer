import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Reminder, Inserts, Updates } from "@/src/types/db/Tables.Types";

// Define DTOs based on the 'reminders' table structure
// These DTOs will automatically include the 'type' field (e.g., "Expense", "Income", "Transfer")
// once the Reminder type in Tables.Types.ts is updated to reflect the database schema.
export type CreateReminderDto = Inserts<TableNames.Reminders>;
export type UpdateReminderDto = Updates<TableNames.Reminders>;

export const listReminders = async (params: { tenantId: string; filters?: any }): Promise<Reminder[]> => {
  let query = supabase
    .from(TableNames.Reminders)
    .select(
      `*, 
       source_account:${TableNames.Accounts}!reminders_source_account_id_fkey(*), 
       category:${TableNames.TransactionCategories}!reminders_category_id_fkey(*)`,
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
  return data as unknown as Reminder[];
};

export const getReminderById = async (id: string, tenantId: string): Promise<Reminder | null> => {
  const { data, error } = await supabase
    .from(TableNames.Reminders)
    .select(
      `*, 
       source_account:${TableNames.Accounts}!reminders_source_account_id_fkey(*), 
       category:${TableNames.TransactionCategories}!reminders_category_id_fkey(*)`,
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
  return data as unknown as Reminder | null;
};

export const createReminder = async (reminderData: CreateReminderDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Reminders)
    // reminderData (CreateReminderDto) is already all lowercase.
    // tenantId property added here must also be lowercase.
    .insert({ ...reminderData, tenantid: tenantId }) // Lowercase
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateReminder = async (id: string, reminderData: UpdateReminderDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Reminders)
    // reminderData (UpdateReminderDto) is already all lowercase.
    // updatedat property added here is already lowercase.
    .update({ ...reminderData, updatedat: dayjs().toISOString() })
    .eq("id", id)
    .eq("tenantid", tenantId) // Lowercase
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteReminder = async (id: string, tenantId: string, userId?: string) => {
  const { data, error } = await supabase
    .from(TableNames.Reminders)
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

// Removed applyReminderTransaction that calls RPC.
// The repository will now handle the multi-step execution logic.
