import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";
import { TransactionGroup } from "../../database/models";
import { TransactionGroup as TransactionGroupType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapTransactionGroupFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class TransactionGroupWatermelonRepository implements ITransactionGroupRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<TransactionGroupType | null> {
    const db = await this.getDb();

    const query = db
      .get("transaction_groups")
      .query(Q.where("Id", id), ...(tenantId ? [Q.where("TenantId", tenantId)] : []), Q.where("IsDeleted", false));

    const results = await query;
    const model = results[0] as TransactionGroup | undefined;

    if (model) {
      // Access the categories relationship to ensure it's loaded
      try {
        const categories = model.categories;
        console.log("Categories loaded for group:", {
          groupId: model.id,
          groupName: model.name,
          categoryCount: categories.length,
        });
      } catch (error) {
        console.warn("Could not load categories for group:", error);
      }
    }

    return model ? mapTransactionGroupFromWatermelon(model) : null;
  }

  async findAll(filters?: any, tenantId?: string): Promise<TransactionGroupType[]> {
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

    const query = db.get("transaction_groups").query(...conditions);
    const results = await query;
    return (results as TransactionGroup[]).map(mapTransactionGroupFromWatermelon);
  }

  async create(data: Inserts<TableNames.TransactionGroups>, tenantId?: string): Promise<TransactionGroupType> {
    const db = await this.getDb();

    console.log("Creating TransactionGroup with data:", data);
    console.log("TenantId:", tenantId);

    return await db.write(async () => {
      console.log("Starting db.write transaction for transaction_groups table");

      const record = await db.get("transaction_groups").create((record: any) => {
        console.log("Creating new record in transaction_groups:", record);
        console.log("Initial record._raw:", record._raw);

        try {
          // Don't manually set ID - WatermelonDB handles this automatically
          console.log("Record ID automatically generated:", record.id);

          if (tenantId) {
            record.tenantId = tenantId;
            record.createdBy = tenantId;
            console.log("Set tenantId and createdBy:", tenantId);
          }

          console.log("Starting field assignment loop...");
          const readonlyFields = ["createdat", "updatedat"]; // createdby and updatedby are not readonly

          Object.entries(data).forEach(([key, value]) => {
            try {
              if (key !== "id" && value !== undefined && !readonlyFields.includes(key.toLowerCase())) {
                const dbKey = key.charAt(0).toUpperCase() + key.slice(1); // Convert to PascalCase
                console.log(`Mapping ${key} -> ${dbKey} = ${value}`);
                record[dbKey] = value;
                console.log(`Successfully set ${dbKey}`);
              } else if (readonlyFields.includes(key.toLowerCase())) {
                console.log(`Skipping readonly field: ${key}`);
              }
            } catch (fieldError) {
              console.error(`Error setting field ${key}:`, fieldError);
              throw fieldError;
            }
          });

          console.log("Field assignment completed, setting remaining fields...");
          // Don't manually set createdAt/updatedAt - they're @readonly and managed by WatermelonDB
          record.isDeleted = false;
          console.log("Set isDeleted to false");

          console.log("Final record._raw before save:", record._raw);
        } catch (setupError) {
          console.error("Error during record setup:", setupError);
          throw setupError;
        }
      });

      console.log("Record creation completed, checking record...");
      console.log("Record created successfully:", record);

      try {
        const typedRecord = record as TransactionGroup;
        console.log("Record properties:", {
          id: typedRecord.id,
          name: typedRecord.name,
          type: typedRecord.type,
          tenantId: typedRecord.tenantId,
          createdAt: typedRecord.createdAt,
          updatedAt: typedRecord.updatedAt,
        });
      } catch (typeError) {
        console.error("Error accessing typed record properties:", typeError);
      }

      console.log("Starting mapping process...");
      try {
        const mappedResult = mapTransactionGroupFromWatermelon(record as TransactionGroup);
        console.log("Mapping successful:", mappedResult);
        return mappedResult;
      } catch (mappingError) {
        console.error("Error in mapping:", mappingError);
        if (mappingError instanceof Error) {
          console.error("Mapping error stack:", mappingError.stack);
        }
        throw mappingError;
      }
    });
  }

  async update(
    id: string,
    data: Updates<TableNames.TransactionGroups>,
    tenantId?: string,
  ): Promise<TransactionGroupType | null> {
    const db = await this.getDb();

    return await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      const query = db.get("transaction_groups").query(...conditions);
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

      return mapTransactionGroupFromWatermelon(updatedRecord as TransactionGroup);
    });
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const conditions = [Q.where("id", id)];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      const query = db.get("transaction_groups").query(...conditions);
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

      const query = db.get("transaction_groups").query(...conditions);
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

      const query = db.get("transaction_groups").query(...conditions);
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
