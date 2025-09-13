// Real implementation moved from Recurrings.api.ts
import supabase from "@/src/providers/Supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
// import { RecurringFilters, RecurringType } from "@/src/types/recurring";
import { SupaRepository } from "../BaseSupaRepository";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

export class RecurringSupaRepository
  extends SupaRepository<Recurring, TableNames.Recurrings>
  implements IRecurringRepository
{
  protected tableName = TableNames.Recurrings;
  override async findAll(tenantId: string): Promise<Recurring[]> {
    let query = supabase
      .from(TableNames.Recurrings)
      .select(
        `*, 
         source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*), 
         category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
      )
      .eq("tenantid", tenantId)
      .eq("isdeleted", false);

    query = query.order("nextoccurrencedate").order("name");

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Recurring[];
  }

  override async findById(id: string, tenantId: string): Promise<Recurring | null> {
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
      throw error;
    }
    return data as unknown as Recurring | null;
  }

  // // Enhanced query methods for due transactions and auto-apply filtering
  // async findDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]> {
  //

  //   const checkDate = asOfDate || new Date();

  //   let query = supabase
  //     .from(TableNames.Recurrings)
  //     .select(
  //       `*,
  //        source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*),
  //        category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
  //     )
  //     .eq("tenantid", tenantId)
  //     .eq("isdeleted", false)
  //     .eq("isactive", true)
  //     .lte("nextoccurrencedate", checkDate.toISOString());

  //   const { data, error } = await query.order("nextoccurrencedate");
  //   if (error) throw error;
  //   return data as unknown as Recurring[];
  // }

  // async findByAutoApplyEnabled(tenantId: string, enabled: boolean): Promise<Recurring[]> {
  //

  //   const { data, error } = await supabase
  //     .from(TableNames.Recurrings)
  //     .select(
  //       `*,
  //        source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*),
  //        category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
  //     )
  //     .eq("tenantid", tenantId)
  //     .eq("isdeleted", false)
  //     .eq("autoapplyenabled", enabled)
  //     .order("nextoccurrencedate");

  //   if (error) throw error;
  //   return data as unknown as Recurring[];
  // }

  // async findByRecurringType(tenantId: string, type: RecurringType): Promise<Recurring[]> {
  //

  //   const { data, error } = await supabase
  //     .from(TableNames.Recurrings)
  //     .select(
  //       `*,
  //        source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*),
  //        category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
  //     )
  //     .eq("tenantid", tenantId)
  //     .eq("isdeleted", false)
  //     .eq("recurringtype", type)
  //     .order("nextoccurrencedate");

  //   if (error) throw error;
  //   return data as unknown as Recurring[];
  // }

  // // Filtering with new criteria
  // async findAllFiltered(filters?: RecurringFilters, tenantId: string): Promise<Recurring[]> {
  //

  //   let query = supabase
  //     .from(TableNames.Recurrings)
  //     .select(
  //       `*,
  //        source_account:${TableNames.Accounts}!recurrings_sourceaccountid_fkey(*),
  //        category:${TableNames.TransactionCategories}!recurrings_categoryid_fkey(*)`,
  //     )
  //     .eq("tenantid", tenantId)
  //     .eq("isdeleted", false);

  //   if (filters) {
  //     if (filters.recurringType !== undefined) {
  //       query = query.eq("recurringtype", filters.recurringType);
  //     }
  //     if (filters.autoApplyEnabled !== undefined) {
  //       query = query.eq("autoapplyenabled", filters.autoApplyEnabled);
  //     }
  //     if (filters.isActive !== undefined) {
  //       query = query.eq("isactive", filters.isActive);
  //     }
  //     if (filters.isDue && filters.asOfDate) {
  //       query = query.lte("nextoccurrencedate", filters.asOfDate.toISOString());
  //     }
  //   }

  //   query = query.order("nextoccurrencedate").order("name");

  //   const { data, error } = await query;
  //   if (error) throw error;
  //   return data as unknown as Recurring[];
  // }

  // // Batch operation methods for updating next occurrence dates and failed attempts
  // async updateNextOccurrenceDates(updates: { id: string; nextDate: Date }[]): Promise<void> {
  //   if (updates.length === 0) return;

  //   // Use a transaction to update multiple records
  //   const updatePromises = updates.map(update =>
  //     supabase
  //       .from(TableNames.Recurrings)
  //       .update({
  //         nextoccurrencedate: update.nextDate.toISOString(),
  //         updatedat: dayjs().toISOString(),
  //       })
  //       .eq("id", update.id),
  //   );

  //   const results = await Promise.allSettled(updatePromises);

  //   // Check for any failures
  //   const failures = results.filter(result => result.status === "rejected");
  //   if (failures.length > 0) {
  //     throw new Error(`Failed to update ${failures.length} recurring transactions`);
  //   }
  // }

  // async incrementFailedAttempts(recurringIds: string[]): Promise<void> {
  //   if (recurringIds.length === 0) return;

  //   // Use RPC function for atomic increment or fallback to individual updates
  //   const updatePromises = recurringIds.map(id =>
  //     supabase
  //       .from(TableNames.Recurrings)
  //       .update({
  //         failedattempts: supabase.rpc("increment_failed_attempts", { recurring_id: id }),
  //         updatedat: dayjs().toISOString(),
  //       })
  //       .eq("id", id),
  //   );

  //   const results = await Promise.allSettled(updatePromises);

  //   // Check for any failures
  //   const failures = results.filter(result => result.status === "rejected");
  //   if (failures.length > 0) {
  //     throw new Error(`Failed to increment failed attempts for ${failures.length} recurring transactions`);
  //   }
  // }

  // async resetFailedAttempts(recurringIds: string[]): Promise<void> {
  //   if (recurringIds.length === 0) return;

  //   const updatePromises = recurringIds.map(id =>
  //     supabase
  //       .from(TableNames.Recurrings)
  //       .update({
  //         failedattempts: 0,
  //         updatedat: dayjs().toISOString(),
  //       })
  //       .eq("id", id),
  //   );

  //   const results = await Promise.allSettled(updatePromises);

  //   // Check for any failures
  //   const failures = results.filter(result => result.status === "rejected");
  //   if (failures.length > 0) {
  //     throw new Error(`Failed to reset failed attempts for ${failures.length} recurring transactions`);
  //   }
  // }

  // // Transfer-specific methods
  // async findRecurringTransfers(tenantId: string): Promise<Recurring[]> {
  //   return this.findByRecurringType(tenantId, RecurringType.Transfer);
  // }

  // async findCreditCardPayments(tenantId: string): Promise<Recurring[]> {
  //   return this.findByRecurringType(tenantId, RecurringType.CreditCardPayment);
  // }

  // // Auto-apply management
  // async updateAutoApplyStatus(recurringId: string, enabled: boolean, tenantId: string): Promise<void> {
  //

  //   const { error } = await supabase
  //     .from(TableNames.Recurrings)
  //     .update({
  //       autoapplyenabled: enabled,
  //       updatedat: dayjs().toISOString(),
  //     })
  //     .eq("id", recurringId)
  //     .eq("tenantid", tenantId);

  //   if (error) throw error;
  // }
}
