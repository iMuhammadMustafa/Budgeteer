import { IRecurringRepository } from "../interfaces/IRecurringRepository";
import { Recurring } from "../../database/models";
import { Recurring as RecurringType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapRecurringFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class RecurringWatermelonRepository implements IRecurringRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<RecurringType | null> {
    try {
      const db = await this.getDb();

      const query = db
        .get("recurrings")
        .query(Q.where("id", id), ...(tenantId ? [Q.where("tenant_id", tenantId)] : []), Q.where("is_deleted", false));

      const results = await query;
      const model = results[0] as Recurring | undefined;
      return model ? mapRecurringFromWatermelon(model) : null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<RecurringType[]> {
    try {
      const db = await this.getDb();
      const conditions = [];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any));
          }
        });
      }

      const query = db.get("recurrings").query(...conditions);
      const results = await query;
      return (results as Recurring[]).map(mapRecurringFromWatermelon);
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: Inserts<TableNames.Recurrings>, tenantId?: string): Promise<RecurringType> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const record = await db.get("recurrings").create((record: any) => {
          if (!data.id) {
            record.id = crypto.randomUUID();
          }

          if (tenantId) {
            record.tenantId = tenantId;
            record.createdBy = tenantId;
          }

          Object.entries(data).forEach(([key, value]) => {
            if (key !== "id" && value !== undefined) {
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          const now = Date.now();
          record.createdAt = now;
          record.updatedAt = now;
          record.isDeleted = false;
        });

        return mapRecurringFromWatermelon(record as Recurring);
      });
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: Updates<TableNames.Recurrings>, tenantId?: string): Promise<RecurringType | null> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("recurrings").query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          return null;
        }

        const updatedRecord = await record.update((record: any) => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          record.updatedAt = Date.now();
        });

        return mapRecurringFromWatermelon(updatedRecord as Recurring);
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

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get("recurrings").query(...conditions);
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

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("recurrings").query(...conditions);
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

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get("recurrings").query(...conditions);
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

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
