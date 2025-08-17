import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { transactionCategories, transactionGroups } from "../../types/db/sqllite/schema";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";
import { 
  TransactionCategory, 
  TransactionCategoryInsert, 
  TransactionCategoryUpdate 
} from "../../types/db/sqllite/schema";
import { asc, desc, eq, and } from "drizzle-orm";

export class TransactionCategorySQLiteRepository 
  extends BaseSQLiteRepository<TransactionCategory, TransactionCategoryInsert, TransactionCategoryUpdate>
  implements ITransactionCategoryRepository {

  protected table = transactionCategories;

  /**
   * Override findAll to match Supabase behavior with joins and ordering
   * Includes transaction group data and proper ordering
   */
  async findAll(filters?: any, tenantId?: string): Promise<TransactionCategory[]> {
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
              case 'groupid':
                conditions.push(eq(this.table.groupid, value as string));
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

      // Match Supabase ordering: displayorder desc, group displayorder desc, then name asc
      // Note: For SQLite, we'll do the join and ordering in a simpler way
      const result = await this.db
        .select({
          // Select all transaction category fields
          id: this.table.id,
          name: this.table.name,
          groupid: this.table.groupid,
          type: this.table.type,
          color: this.table.color,
          icon: this.table.icon,
          description: this.table.description,
          displayorder: this.table.displayorder,
          budgetamount: this.table.budgetamount,
          budgetfrequency: this.table.budgetfrequency,
          tenantid: this.table.tenantid,
          isdeleted: this.table.isdeleted,
          createdat: this.table.createdat,
          createdby: this.table.createdby,
          updatedat: this.table.updatedat,
          updatedby: this.table.updatedby,
          // Include group data (simplified - not nested like Supabase)
          group: {
            id: transactionGroups.id,
            name: transactionGroups.name,
            type: transactionGroups.type,
            displayorder: transactionGroups.displayorder,
          }
        })
        .from(this.table)
        .leftJoin(transactionGroups, eq(this.table.groupid, transactionGroups.id))
        .where(whereClause)
        .orderBy(
          desc(this.table.displayorder), 
          desc(transactionGroups.displayorder), 
          asc(this.table.name)
        );

      return result as TransactionCategory[];
    } catch (error) {
      throw new Error(`Failed to find transaction categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}