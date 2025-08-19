import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";
import { AccountCategory } from "../../database/models";
import { AccountCategory as AccountCategoryType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapAccountCategoryFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class AccountCategoryWatermelonRepository implements IAccountCategoryRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<AccountCategoryType | null> {
    try {
      const db = await this.getDb();

      const query = db
        .get("account_categories")
        .query(Q.where("id", id), ...(tenantId ? [Q.where("tenant_id", tenantId)] : []), Q.where("is_deleted", false));

      const results = await query;
      const model = results[0] as AccountCategory | undefined;
      return model ? mapAccountCategoryFromWatermelon(model) : null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<AccountCategoryType[]> {
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

      const query = db.get("account_categories").query(...conditions);
      const results = await query;
      return (results as AccountCategory[]).map(mapAccountCategoryFromWatermelon);
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: Inserts<TableNames.AccountCategories>, tenantId?: string): Promise<AccountCategoryType> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const record = await db.get("account_categories").create((record: any) => {
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

        return mapAccountCategoryFromWatermelon(record as AccountCategory);
      });
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(
    id: string,
    data: Updates<TableNames.AccountCategories>,
    tenantId?: string,
  ): Promise<AccountCategoryType | null> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("account_categories").query(...conditions);
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

        return mapAccountCategoryFromWatermelon(updatedRecord as AccountCategory);
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

        const query = db.get("account_categories").query(...conditions);
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

        const query = db.get("account_categories").query(...conditions);
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

        const query = db.get("account_categories").query(...conditions);
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
