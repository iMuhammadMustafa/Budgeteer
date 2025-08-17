import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { eq, and } from "drizzle-orm";
import { getSQLiteDB, isSQLiteReady } from "../../providers/SQLite";
import { IRepository } from "../interfaces/IRepository";
import * as schema from "../../types/db/sqllite/schema";

export abstract class BaseSQLiteRepository<T, InsertType, UpdateType>
  implements IRepository<T, InsertType, UpdateType>
{
  protected get db(): ExpoSQLiteDatabase<typeof schema> {
    if (!isSQLiteReady()) {
      throw new Error("SQLite database not initialized. Call initializeSQLite() first.");
    }

    return getSQLiteDB();
  }

  // Abstract property that concrete repositories must define
  protected abstract table: any;

  async findById(id: string, tenantId?: string): Promise<T | null> {
    try {
      const conditions = [eq(this.table.id, id)];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      // Add soft delete filtering if table has isdeleted column
      if ("isdeleted" in this.table) {
        conditions.push(eq(this.table.isdeleted, false));
      }

      const result = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      return (result as T[])[0] || null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<T[]> {
    try {
      const conditions = [];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      // Add soft delete filtering if table has isdeleted column
      if ("isdeleted" in this.table) {
        conditions.push(eq(this.table.isdeleted, false));
      }

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (key in this.table && value !== undefined) {
            conditions.push(eq(this.table[key], value));
          }
        });
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db.select().from(this.table).where(whereClause);

      return result as T[];
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: InsertType, tenantId?: string): Promise<T> {
    try {
      // Add tenant ID to data if provided and table has tenantid column
      const insertData = { ...data } as any;
      if (tenantId && "tenantid" in this.table) {
        insertData.tenantid = tenantId;
      }

      // Add timestamps if table has these columns
      const now = new Date().toISOString();
      if ("createdat" in this.table) {
        insertData.createdat = now;
      }
      if ("updatedat" in this.table) {
        insertData.updatedat = now;
      }

      const readDb = await this.db.select().from(this.table).limit(1);
      console.log("readDb", readDb);

      const result = await this.db.insert(this.table).values(insertData).returning();
      console.log("res", result);

      const resultArray = result as T[];
      if (!resultArray[0]) {
        throw new Error("Failed to create record - no data returned");
      }

      return resultArray[0];
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: UpdateType, tenantId?: string): Promise<T | null> {
    try {
      const conditions = [eq(this.table.id, id)];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      // Add soft delete filtering if table has isdeleted column
      if ("isdeleted" in this.table) {
        conditions.push(eq(this.table.isdeleted, false));
      }

      // Add update timestamp if table has updatedat column
      const updateData = { ...data } as any;
      if ("updatedat" in this.table) {
        updateData.updatedat = new Date().toISOString();
      }

      const result = await this.db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions))
        .returning();

      return (result as T[])[0] || null;
    } catch (error) {
      throw new Error(`Failed to update record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const conditions = [eq(this.table.id, id)];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      await this.db.delete(this.table).where(and(...conditions));
    } catch (error) {
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    try {
      // Check if table supports soft delete
      if (!("isdeleted" in this.table)) {
        throw new Error("Table does not support soft delete");
      }

      const conditions = [eq(this.table.id, id)];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      const updateData: any = { isdeleted: true };
      if ("updatedat" in this.table) {
        updateData.updatedat = new Date().toISOString();
      }

      await this.db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions));
    } catch (error) {
      throw new Error(`Failed to soft delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    try {
      // Check if table supports soft delete
      if (!("isdeleted" in this.table)) {
        throw new Error("Table does not support restore");
      }

      const conditions = [eq(this.table.id, id)];

      // Add tenant filtering if tenantId is provided and table has tenantid column
      if (tenantId && "tenantid" in this.table) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      const updateData: any = { isdeleted: false };
      if ("updatedat" in this.table) {
        updateData.updatedat = new Date().toISOString();
      }

      await this.db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions));
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
