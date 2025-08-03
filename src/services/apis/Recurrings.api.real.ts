// Real implementation moved from Recurrings.api.ts
import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";

export type CreateRecurringDto = Inserts<TableNames.Recurrings>;
export type UpdateRecurringDto = Updates<TableNames.Recurrings>;

export const listRecurrings = async (params: { tenantId: string; filters?: any }): Promise<Recurring[]> => {
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
  if (error) throw new Error(error.message);
  return data as unknown as Recurring[];
};

export const getRecurringById = async (id: string, tenantId: string): Promise<Recurring | null> => {
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
      return null;
    }
    throw new Error(error.message);
  }
  return data as unknown as Recurring | null;
};

export const createRecurring = async (recurringData: CreateRecurringDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    .insert({ ...recurringData, tenantid: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateRecurring = async (id: string, recurringData: UpdateRecurringDto, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Recurrings)
    .update({ ...recurringData, updatedat: dayjs().toISOString() })
    .eq("id", id)
    .eq("tenantid", tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRecurring = async (id: string, tenantId: string, userId?: string) => {
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
  if (error) throw error;
  return data;
};
