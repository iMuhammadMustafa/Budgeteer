import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { accountCategories } from "../../types/db/sqllite/schema";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";
import { AccountCategory, AccountCategoryInsert, AccountCategoryUpdate } from "../../types/db/sqllite/schema";
import { asc, desc, eq, and } from "drizzle-orm";

export class AccountCategorySQLiteRepository
  extends BaseSQLiteRepository<AccountCategory, AccountCategoryInsert, AccountCategoryUpdate>
  implements IAccountCategoryRepository
{
  protected table = accountCategories;
  private readonly DEFAULT_TIMEOUT_MS = 10000;

  /**
   * Override findAll to match Supabase behavior with ordering
   */
  async findAll(filters?: any, tenantId?: string): Promise<AccountCategory[]> {
    try {
      const conditions = [];

      // Add tenant filtering if tenantId is provided
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      // Add soft delete filtering
      if ("isdeleted" in this.table) {
        conditions.push(eq(this.table.isdeleted, false));
      }

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            // Type-safe property access for known columns
            switch (key) {
              case "type":
                conditions.push(eq(this.table.type, value as "Asset" | "Liability"));
                break;
              case "name":
                conditions.push(eq(this.table.name, value as string));
                break;
              case "color":
                conditions.push(eq(this.table.color, value as string));
                break;
              case "icon":
                conditions.push(eq(this.table.icon, value as string));
                break;
              case "displayorder":
                conditions.push(eq(this.table.displayorder, value as number));
                break;
              // Add other filterable columns as needed
            }
          }
        });
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Match Supabase ordering: displayorder desc, then name asc
      const db = await this.getDb();
      const result = await db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(desc(this.table.displayorder), asc(this.table.name));

      // const result = await this.withTimeout(operation, 10000, "Find all account categories");
      return result as AccountCategory[];
    } catch (error) {
      throw new Error(`Failed to find account categories: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
