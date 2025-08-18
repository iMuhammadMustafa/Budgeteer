import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { eq, and } from "drizzle-orm";
import { getSQLiteDB } from "../../providers/SQLite";
import { IRepository } from "../interfaces/IRepository";
import * as schema from "../../types/db/sqllite/schema";

export abstract class BaseSQLiteRepository<T, InsertType, UpdateType>
  implements IRepository<T, InsertType, UpdateType>
{
  // Default timeout for database operations (in milliseconds)
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  protected async getDb(): Promise<ExpoSQLiteDatabase<typeof schema>> {
    const db = await getSQLiteDB();
    if (!db) {
      throw new Error("Failed to initialize SQLite database");
    }
    return db;
  }

  /**
   * Wraps a database operation with a timeout to prevent hanging
   */
  async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT,
    operationName: string = "Database operation",
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `${operationName} timed out after ${timeoutMs}ms. This may indicate a deadlock or connection issue.`,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } catch (error) {
      // If it's our timeout error, throw it as-is
      if (error instanceof Error && error.message.includes("timed out")) {
        throw error;
      }
      // For other errors, wrap them with context
      throw new Error(`${operationName} failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
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

      const db = await this.getDb();
      const operation = db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      const result = await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Find by ID");
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

      const db = await this.getDb();
      const operation = db.select().from(this.table).where(whereClause);
      const result = await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Find all records");

      return result as T[];
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: InsertType, tenantId?: string): Promise<T> {
    try {
      // Add tenant ID to data if provided and table has tenantid column
      const insertData = { ...data } as any;

      // Generate ID if not provided
      if (!insertData.id) {
        insertData.id = crypto.randomUUID();
      }

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

      const db = await this.getDb();
      const operation = db.insert(this.table).values(insertData).returning();
      const result = await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Create record");

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

      const db = await this.getDb();
      const operation = db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions))
        .returning();

      const result = await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Update record");
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

      const db = await this.getDb();
      const operation = db.delete(this.table).where(and(...conditions));
      await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Delete record");
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

      const db = await this.getDb();
      const operation = db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions));

      await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Soft delete record");
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

      const db = await this.getDb();
      const operation = db
        .update(this.table)
        .set(updateData)
        .where(and(...conditions));

      await this.withTimeout(operation, this.DEFAULT_TIMEOUT, "Restore record");
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
