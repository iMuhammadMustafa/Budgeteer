import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IRecurringRepository {
  listRecurrings(params: { tenantId: string; filters?: any }): Promise<Recurring[]>;
  getRecurringById(id: string, tenantId: string): Promise<Recurring | null>;
  createRecurring(recurringData: Inserts<TableNames.Recurrings>, tenantId: string): Promise<any>;
  updateRecurring(id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string): Promise<any>;
  deleteRecurring(id: string, tenantId: string, userId?: string): Promise<any>;
}
