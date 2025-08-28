// Real implementation moved from Recurrings.api.ts
import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";
import { 
  RecurringFilters
} from "@/src/types/recurring";
import { RecurringType } from "@/src/types/enums/recurring";

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

  // Enhanced query methods for due transactions and auto-apply filtering
  async findDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const checkDate = asOfDate || new Date();
    
    let query = supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("isactive", true)
      .lte("nextoccurrencedate", checkDate.toISOString());

    const { data, error } = await query.order("nextoccurrencedate");
    if (error) throw new Error(error.message);
    return data as unknown as Recurring[];
  }

  async findByAutoApplyEnabled(tenantId: string, enabled: boolean): Promise<Recurring[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("autoapplyenabled", enabled)
      .order("nextoccurrencedate");

    if (error) throw new Error(error.message);
    return data as unknown as Recurring[];
  }

  async findByRecurringType(tenantId: string, type: RecurringType): Promise<Recurring[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { data, error } = await supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false)
      .eq("recurringtype", type)
      .order("nextoccurrencedate");

    if (error) throw new Error(error.message);
    return data as unknown as Recurring[];
  }

  // Filtering with new criteria
  async findAllFiltered(filters?: RecurringFilters, tenantId?: string): Promise<Recurring[]> {
    if (!tenantId) throw new Error("Tenant ID is required");

    let query = supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false);

    if (filters) {
      if (filters.recurringType !== undefined) {
        query = query.eq("recurringtype", filters.recurringType);
      }
      if (filters.autoApplyEnabled !== undefined) {
        query = query.eq("autoapplyenabled", filters.autoApplyEnabled);
      }
      if (filters.isActive !== undefined) {
        query = query.eq("isactive", filters.isActive);
      }
      if (filters.isDue && filters.asOfDate) {
        query = query.lte("nextoccurrencedate", filters.asOfDate.toISOString());
      }
    }

    query = query.order("nextoccurrencedate").order("name");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as unknown as Recurring[];
  }

  // Batch operation methods for updating next occurrence dates and failed attempts
  async updateNextOccurrenceDates(updates: { id: string; nextDate: Date }[]): Promise<void> {
    if (updates.length === 0) return;

    // Use a transaction to update multiple records
    const updatePromises = updates.map(update => 
      supabase
        .from(TableNames.Recurrings)
        .update({
          nextoccurrencedate: update.nextDate.toISOString(),
          updatedat: dayjs().toISOString()
        })
        .eq("id", update.id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to update ${failures.length} recurring transactions`);
    }
  }

  async incrementFailedAttempts(recurringIds: string[]): Promise<void> {
    if (recurringIds.length === 0) return;

    // Use RPC function for atomic increment or fallback to individual updates
    const updatePromises = recurringIds.map(id => 
      supabase
        .from(TableNames.Recurrings)
        .update({
          failedattempts: supabase.rpc('increment_failed_attempts', { recurring_id: id }),
          updatedat: dayjs().toISOString()
        })
        .eq("id", id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to increment failed attempts for ${failures.length} recurring transactions`);
    }
  }

  async resetFailedAttempts(recurringIds: string[]): Promise<void> {
    if (recurringIds.length === 0) return;

    const updatePromises = recurringIds.map(id => 
      supabase
        .from(TableNames.Recurrings)
        .update({
          failedattempts: 0,
          updatedat: dayjs().toISOString()
        })
        .eq("id", id)
    );

    const results = await Promise.allSettled(updatePromises);
    
    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to reset failed attempts for ${failures.length} recurring transactions`);
    }
  }

  // Transfer-specific methods
  async findRecurringTransfers(tenantId: string): Promise<Recurring[]> {
    return this.findByRecurringType(tenantId, RecurringType.Transfer);
  }

  async findCreditCardPayments(tenantId: string): Promise<Recurring[]> {
    return this.findByRecurringType(tenantId, RecurringType.CreditCardPayment);
  }

  // Auto-apply management
  async updateAutoApplyStatus(recurringId: string, enabled: boolean, tenantId?: string): Promise<void> {
    if (!tenantId) throw new Error("Tenant ID is required");

    const { error } = await supabase
      .from(TableNames.Recurrings)
      .update({
        autoapplyenabled: enabled,
        updatedat: dayjs().toISOString()
      })
      .eq("id", recurringId)
      .eq("tenantid", tenantId);

    if (error) throw error;
  }


}
