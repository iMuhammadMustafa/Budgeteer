// Real implementation moved from Recurrings.api.ts
import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

export class RecurringSupaRepository implements IRecurringRepository {
  async findAll(filters?: any, tenantId?: string): Promise<Recurring[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    let query = supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false);

    if (filters) {
      // Example: apply filters if provided
      // if (filters.isactive !== undefined) {
      //   query = query.eq("isactive", filters.isactive);
      // }
    }

    query = query.order("nextoccurrencedate").order("name");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as unknown as Recurring[];
  }

  async findById(id: string, tenantId?: string): Promise<Recurring | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

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
      if (error.code === "PGRST116") return null; // No rows found
      throw new Error(error.message);
    }
    return data as unknown as Recurring | null;
  }

  async create(data: Inserts<TableNames.Recurrings>, tenantId?: string): Promise<Recurring> {
    const { data: result, error } = await supabase
      .from(TableNames.Recurrings)
      .insert({ ...data, tenantid: tenantId || data.tenantid })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Updates<TableNames.Recurrings>, tenantId?: string): Promise<Recurring | null> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data: result, error } = await supabase
      .from(TableNames.Recurrings)
      .update({ ...data, updatedat: dayjs().toISOString() })
      .eq("id", id)
      .eq("tenantid", tenantId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      throw error;
    }
    return result;
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase.from(TableNames.Recurrings).delete().eq("id", id).eq("tenantid", tenantId);
    if (error) throw error;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase
      .from(TableNames.Recurrings)
      .update({
        isdeleted: true,
        updatedat: dayjs().toISOString(),
      })
      .eq("id", id)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase
      .from(TableNames.Recurrings)
      .update({
        isdeleted: false,
        updatedat: dayjs().toISOString(),
      })
      .eq("id", id)
      .eq("tenantid", tenantId);
    if (error) throw error;
  }
}
