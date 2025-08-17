import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { transactionGroups } from "../../types/db/sqllite/schema";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";
import { 
  TransactionGroup, 
  TransactionGroupInsert, 
  TransactionGroupUpdate 
} from "../../types/db/sqllite/schema";
import { asc, desc, eq, and } from "drizzle-orm";

export class TransactionGroupSQLiteRepository 
  extends BaseSQLiteRepository<TransactionGroup, TransactionGroupInsert, TransactionGroupUpdate>
  implements ITransactionGroupRepository {

  protected table = transactionGroups;

  /**
   * Override findAll to match Supabase behavior with proper ordering
   * Orders by displayorder desc, then name asc
   */
  async findAll(filters?: any, tenantId?: string): Promise<TransactionGroup[]> {
    try {
      const conditions = [];

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      // Add soft delete filtering
      conditions.push(eq(this.table.isdeleted, false));

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            // Type-safe property access for known columns
            switch (key) {
              case 'type':
                conditions.push(eq(this.table.type, value as "Expense" | "Income" | "Transfer" | "Adjustment" | "Initial" | "Refund"));
                break;
              case 'name':
                conditions.push(eq(this.table.name, value as string));
                break;
              case 'color':
                conditions.push(eq(this.table.color, value as string));
                break;
              case 'icon':
                conditions.push(eq(this.table.icon, value as string));
                break;
              case 'displayorder':
                conditions.push(eq(this.table.displayorder, value as number));
                break;
              case 'budgetamount':
                conditions.push(eq(this.table.budgetamount, value as number));
                break;
              case 'budgetfrequency':
                conditions.push(eq(this.table.budgetfrequency, value as string));
                break;
              // Add other filterable columns as needed
            }
          }
        });
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Match Supabase ordering: displayorder desc, then name asc
      const result = await this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(desc(this.table.displayorder), asc(this.table.name));

      return result as TransactionGroup[];
    } catch (error) {
      throw new Error(`Failed to find transaction groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}