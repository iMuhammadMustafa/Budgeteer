import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";
import { RecurringFilters } from "@/src/types/recurring";
import { RecurringType } from "@/src/types/recurring";

export interface IRecurringRepository
  extends IRepository<Recurring, Inserts<TableNames.Recurrings>, Updates<TableNames.Recurrings>> {
  // Enhanced query methods for due transactions and auto-apply filtering
  findDueRecurringTransactions(tenantId: string, asOfDate?: Date): Promise<Recurring[]>;
  findByAutoApplyEnabled(tenantId: string, enabled: boolean): Promise<Recurring[]>;
  findByRecurringType(tenantId: string, type: RecurringType): Promise<Recurring[]>;

  // Filtering with new criteria
  findAllFiltered(filters?: RecurringFilters, tenantId?: string): Promise<Recurring[]>;

  // Batch operation methods for updating next occurrence dates and failed attempts
  updateNextOccurrenceDates(updates: { id: string; nextDate: Date }[]): Promise<void>;
  incrementFailedAttempts(recurringIds: string[]): Promise<void>;
  resetFailedAttempts(recurringIds: string[]): Promise<void>;

  // Transfer-specific methods
  findRecurringTransfers(tenantId: string): Promise<Recurring[]>;
  findCreditCardPayments(tenantId: string): Promise<Recurring[]>;

  // Auto-apply management
  updateAutoApplyStatus(recurringId: string, enabled: boolean, tenantId?: string): Promise<void>;
}
