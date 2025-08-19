import { Model, Q } from "@nozbe/watermelondb";
import { getWatermelonDB } from "../../database";
import { IRepository } from "../interfaces/IRepository";

export abstract class BaseWatermelonRepository<T extends Model, InsertType, UpdateType>
  implements IRepository<T, InsertType, UpdateType>
{
  // Abstract property that concrete repositories must define
  protected abstract tableName: string;
  protected abstract modelClass: typeof Model;

  protected async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    try {
      const db = await this.getDb();

      const query = db.get(this.tableName).query(
        Q.where("id", id),
        // Add tenant filtering if tenantId is provided
        ...(tenantId ? [Q.where("tenant_id", tenantId)] : []),
        // Add soft delete filtering
        Q.where("is_deleted", false),
      );

      const results = await query;
      return (results[0] as T) || null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<T[]> {
    try {
      const db = await this.getDb();
      const conditions = [];

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      // Add soft delete filtering
      conditions.push(Q.where("is_deleted", false));

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any));
          }
        });
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;
      return results as T[];
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: InsertType, tenantId?: string): Promise<T> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const record = await db.get(this.tableName).create((record: any) => {
          // Generate ID if not provided
          if (!data || typeof data !== "object" || !("id" in data) || !data.id) {
            record.id = crypto.randomUUID();
          }

          // Set tenant ID if provided
          if (tenantId) {
            record.tenantId = tenantId;
            record.createdBy = tenantId;
          }

          // Set all provided data
          Object.entries(data as Record<string, any>).forEach(([key, value]) => {
            if (key !== "id" && value !== undefined) {
              // Convert camelCase to snake_case for database columns
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          // Set timestamps
          const now = Date.now();
          record.createdAt = now;
          record.updatedAt = now;
          record.isDeleted = false;
        });

        return record as T;
      });
    } catch (error) {
      console.error("Create error:", error);
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: UpdateType, tenantId?: string): Promise<T | null> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        // Add tenant filtering if tenantId is provided
        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        // Add soft delete filtering
        conditions.push(Q.where("is_deleted", false));

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          return null;
        }

        const updatedRecord = await record.update((record: any) => {
          // Set all provided data
          Object.entries(data as Record<string, any>).forEach(([key, value]) => {
            if (value !== undefined) {
              // Convert camelCase to snake_case for database columns
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          // Update timestamp
          record.updatedAt = Date.now();
        });

        return updatedRecord as T;
      });
    } catch (error) {
      throw new Error(`Failed to update record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        // Add tenant filtering if tenantId is provided
        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.destroyPermanently();
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        // Add tenant filtering if tenantId is provided
        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        // Add soft delete filtering
        conditions.push(Q.where("is_deleted", false));

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = true;
            record.updatedAt = Date.now();
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to soft delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        // Add tenant filtering if tenantId is provided
        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = false;
            record.updatedAt = Date.now();
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Helper method to convert camelCase to snake_case
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Helper method to convert snake_case to camelCase
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
