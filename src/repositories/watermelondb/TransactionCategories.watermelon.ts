import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";
import { TransactionCategory } from "../../database/models";
import { TransactionCategory as TransactionCategoryType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapTransactionCategoryFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class TransactionCategoryWatermelonRepository implements ITransactionCategoryRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<TransactionCategoryType | null> {
    const db = await this.getDb();

    const query = db
      .get("transaction_categories")
      .query(Q.where("Id", id), ...(tenantId ? [Q.where("TenantId", tenantId)] : []), Q.where("IsDeleted", false));

    const results = await query;
    const model = results[0] as TransactionCategory | undefined;

    if (model) {
      // Access the group relationship to ensure it's loaded
      try {
        const group = model.group;
        console.log("Group loaded for category:", {
          categoryId: model.id,
          categoryName: model.name,
          groupId: group.id,
          groupName: group.name,
        });
      } catch (error) {
        console.warn("Could not load group for category:", error);
      }
    }

    return model ? mapTransactionCategoryFromWatermelon(model) : null;
  }

  async findAll(filters?: any, tenantId?: string): Promise<TransactionCategoryType[]> {
    const db = await this.getDb();
    const conditions = [];

    if (tenantId) {
      conditions.push(Q.where("TenantId", tenantId));
    }

    conditions.push(Q.where("IsDeleted", false));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    const query = db.get("transaction_categories").query(...conditions);
    const results = await query;
    return (results as TransactionCategory[]).map(mapTransactionCategoryFromWatermelon);
  }

  async create(data: Inserts<TableNames.TransactionCategories>, tenantId?: string): Promise<TransactionCategoryType> {
    console.log("Creating TransactionCategory with data:", data);
    console.log("Checking groupid field specifically:", data.groupid);
    const db = await this.getDb();

    // Validate that the group exists if group_id is provided
    if (data.groupid) {
      console.log("Validating group exists with ID:", data.groupid);
      const groupExists = await db
        .get("transaction_groups")
        .query(
          Q.where("Id", data.groupid),
          Q.where("IsDeleted", false),
          ...(tenantId ? [Q.where("TenantId", tenantId)] : []),
        );

      if (groupExists.length === 0) {
        throw new Error(`TransactionGroup with ID ${data.groupid} does not exist or is deleted`);
      }
      console.log("Group validation passed for groupId:", data.groupid);
    } else {
      console.log("No groupid provided in data, this might be the issue!");
    }

    return await db.write(async () => {
      const record = await db.get("transaction_categories").create((record: any) => {
        // Don't manually set ID - WatermelonDB handles this automatically
        console.log("Record ID automatically generated:", record.id);
        console.log("Initial record._raw:", record._raw);

        if (tenantId) {
          record.tenantId = tenantId;
          record.createdBy = tenantId;
        }

        console.log("Starting field mapping...");
        Object.entries(data).forEach(([key, value]) => {
          if (key !== "id" && value !== undefined) {
            // Direct mapping since models now use PascalCase column names
            const dbKey = key.charAt(0).toUpperCase() + key.slice(1); // Convert to PascalCase
            console.log(`Mapping field: ${key} -> ${dbKey} = "${value}" (type: ${typeof value})`);
            record[dbKey] = value;

            // Special logging for groupid
            if (key.toLowerCase() === "groupid") {
              console.log("GROUPID MAPPING:", {
                originalKey: key,
                dbKey: dbKey,
                value: value,
                type: typeof value,
                isEmpty: value === "",
                isNull: value === null,
                isUndefined: value === undefined,
              });
            }
          } else {
            console.log(`Skipping field: ${key} = ${value} (undefined or id)`);
          }
        });

        // Don't manually set createdAt/updatedAt - they're @readonly and managed by WatermelonDB
        record.isDeleted = false;

        console.log("Final record._raw after field mapping:", record._raw);
      });
      console.log("record From Watermelon", record);

      return mapTransactionCategoryFromWatermelon(record as TransactionCategory);
    });
  }

  async update(
    id: string,
    data: Updates<TableNames.TransactionCategories>,
    tenantId?: string,
  ): Promise<TransactionCategoryType | null> {
    const db = await this.getDb();

    return await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      const query = db.get("transaction_categories").query(...conditions);
      const results = await query;
      const record = results[0];

      if (!record) {
        return null;
      }

      const updatedRecord = await record.update((record: any) => {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            const dbKey = key.charAt(0).toUpperCase() + key.slice(1); // Convert to PascalCase
            record[dbKey] = value;
          }
        });

        record.updatedAt = Date.now();
      });

      return mapTransactionCategoryFromWatermelon(updatedRecord as TransactionCategory);
    });
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      const query = db.get("transaction_categories").query(...conditions);
      const results = await query;
      const record = results[0];

      if (record) {
        await record.destroyPermanently();
      }
    });
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      const query = db.get("transaction_categories").query(...conditions);
      const results = await query;
      const record = results[0];

      if (record) {
        await record.update((record: any) => {
          record.isDeleted = true;
          record.updatedAt = Date.now();
        });
      }
    });
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      const query = db.get("transaction_categories").query(...conditions);
      const results = await query;
      const record = results[0];

      if (record) {
        await record.update((record: any) => {
          record.isDeleted = false;
          record.updatedAt = Date.now();
        });
      }
    });
  }
}
