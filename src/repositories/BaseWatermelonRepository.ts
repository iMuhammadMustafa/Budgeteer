import { Model, Q } from "@nozbe/watermelondb";
import { TableNames } from "../types/database/TableNames";
import { Inserts, Updates } from "../types/database/Tables.Types";
import { getWatermelonDB } from "../types/database/watermelon";
import { getDefaultTenantId } from "../types/database/watermelon/constants";
import { IRepository } from "./interfaces/IRepository";

export abstract class BaseWatermelonRepository<
  TModel extends Model,
  TTable extends TableNames,
  TMapped,
> implements IRepository<TMapped, TTable> {
  // Abstract properties that concrete repositories must define
  protected abstract tableName: string;
  protected abstract orderByField?: string;

  // Abstract method for mapping WatermelonDB models to the expected type
  protected mapFromWatermelon(model: TModel): TMapped {
    return model as unknown as TMapped;
  }

  // Optional method for custom field mapping during create/update
  protected mapFieldsForWatermelon(data: Record<string, any>): Record<string, any> {
    return data;
  }

  protected async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId: string): Promise<TMapped | null> {
    const db = await this.getDb();

    const query = db
      .get(this.tableName)
      .query(Q.where("id", id), Q.where("tenantId", tenantId), Q.where("isdeleted", false));

    const results = await query;
    const model = results[0] as TModel;
    return model ? this.mapFromWatermelon(model) : null;
  }

  async findAll(tenantId: string, filters?: any): Promise<TMapped[]> {
    const db = await this.getDb();
    const conditions = [];

    const collection = db.get(this.tableName);
    if (!collection) {
      throw new Error(
        `Collection "${this.tableName}" not found in WatermelonDB. Check your tableName and model registration.`,
      );
    }

    conditions.push(Q.where("tenantid", tenantId));

    // isDeleted filter: undefined = non-deleted only, true = deleted only, false = all
    if (filters?.isDeleted === undefined) {
      conditions.push(Q.where("isdeleted", false));
    } else if (filters?.isDeleted === true) {
      conditions.push(Q.where("isdeleted", true));
    }
    // isDeleted === false means show all, no filter needed

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "isDeleted" && key !== "raw") {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    let query;
    if (this.orderByField) {
      query = db.get(this.tableName).query(...conditions, Q.sortBy(this.orderByField, "desc"));
    } else {
      query = db.get(this.tableName).query(...conditions);
    }

    const results = await query;

    // If raw=true, return raw data without relationship mapping
    if (filters?.raw) {
      return this.mapToRawData(results as TModel[], collection);
    }

    return (results as TModel[]).map(model => this.mapFromWatermelon(model));
  }

  /**
   * Maps WatermelonDB models to raw data objects (for export)
   * Only includes schema-defined columns, not relationships
   */
  protected mapToRawData(models: TModel[], collection: any): TMapped[] {
    const validColumns = new Set(Object.values(collection.schema.columns).map((c: any) => c.name));
    validColumns.add("id");

    return models.map((model: any) => {
      const raw: Record<string, any> = {};

      for (const key of validColumns) {
        if (model._raw && model._raw[key] !== undefined) {
          raw[key] = model._raw[key];
        } else if (model[key] !== undefined && typeof model[key] !== 'function') {
          raw[key] = model[key];
        }
      }

      raw.id = model.id;
      return raw as unknown as TMapped;
    });
  }

  async create(data: Inserts<TTable>, tenantId: string): Promise<TMapped> {
    const db = await this.getDb();

    return await db.write(async () => {
      const mappedData = this.mapFieldsForWatermelon(data as Record<string, any>);

      const collection = db.get(this.tableName);
      const validColumns = new Set(Object.values(collection.schema.columns).map((c: any) => c.name));
      validColumns.add("id");
      validColumns.add("tenantid");
      validColumns.add("isdeleted");
      validColumns.add("createdat");
      validColumns.add("updatedat");
      validColumns.add("createdby");
      validColumns.add("updatedby");

      const record = await collection.create((record: any) => {
        Object.entries(mappedData).forEach(([key, value]) => {
          // Skip fields that aren't in the schema to avoid WatermelonDB errors
          if (!validColumns.has(key) && key !== "id") return;

          switch (key) {
            case "id":
              if (value) {
                record._raw.id = value;
              }
              break;
            default:
              if (value !== undefined) {
                record[key] = value;
              }
          }
        });

        record.tenantId = tenantId || getDefaultTenantId();
        record.isdeleted = false;
        record.createdat = record.createdat || new Date().toISOString();
        record.updatedat = record.updatedat || new Date().toISOString();
      });

      return this.mapFromWatermelon(record as TModel);
    });
  }

  async update(id: string, data: Updates<TTable>, tenantId: string): Promise<TMapped | null> {
    const db = await this.getDb();

    return await db.write(async () => {
      const results = await db
        .get(this.tableName)
        .query(Q.where("id", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));
      const record = results[0];

      if (!record) return null;

      const mappedData = this.mapFieldsForWatermelon(data as Record<string, any>);

      const updatedRecord = await record.update((record: any) => {
        const excludedFields = ["id", "createdat", "createdby", "tenantId"];

        const collection = db.get(this.tableName);
        const validColumns = new Set(Object.values(collection.schema.columns).map((c: any) => c.name));
        validColumns.add("updatedat");
        validColumns.add("isdeleted");

        Object.entries(mappedData).forEach(([key, value]) => {
          if (value !== undefined && !excludedFields.includes(key.toLowerCase())) {
            if (validColumns.has(key)) {
              record[key] = value;
            }
          }
        });

        record.updatedat = new Date().toISOString();
      });

      return updatedRecord ? this.mapFromWatermelon(updatedRecord as TModel) : null;
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Default delete behavior is soft delete
    return this.softDelete(id, tenantId);
  }

  async hardDelete(id: string, tenantId: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const result = await db.get(this.tableName).query(Q.where("id", id), Q.where("tenantid", tenantId));
      const record = result[0];

      if (record) {
        await record.destroyPermanently();
      }
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const db = await this.getDb();
    await db.write(async () => {
      const results = await db
        .get(this.tableName)
        .query(Q.where("id", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));
      const record = results[0];

      if (record) {
        await record.update((record: any) => {
          record.isdeleted = true;
          record.updatedat = new Date().toISOString();
        });
      }
    });
  }

  async restore(id: string, tenantId: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      const results = await db
        .get(this.tableName)
        .query(Q.where("id", id), Q.where("tenantid", tenantId), Q.where("isdeleted", true));
      const record = results[0];

      if (record) {
        await record.update((record: any) => {
          record.isdeleted = false;
          record.updatedat = new Date().toISOString();
          // updatedby should be set by the service layer, not here
        });
      }
    });
  }



  /**
   * Get all record IDs across ALL tenants (no tenant filtering)
   * Used for duplicate detection during import since WatermelonDB IDs are globally unique
   */
  async getAllIds(): Promise<string[]> {
    const db = await this.getDb();

    const collection = db.get(this.tableName);
    if (!collection) {
      return [];
    }

    // Query ALL records, no tenant filter
    const results = await collection.query();

    return results.map((model: any) => model.id);
  }

  async updateMultiple(data: Updates<TTable>[], tenantId: string): Promise<void> {
    const db = await this.getDb();

    await db.write(async () => {
      for (const item of data) {
        if (!item.id) continue;

        const results = await db
          .get(this.tableName)
          .query(Q.where("id", item.id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));
        const record = results[0];

        if (!record) continue;

        const mappedData = this.mapFieldsForWatermelon(item as Record<string, any>);

        await record.update((record: any) => {
          const excludedFields = ["id", "createdat", "createdby", "tenantId"];

          const collection = db.get(this.tableName);
          const validColumns = new Set(Object.values(collection.schema.columns).map((c: any) => c.name));
          validColumns.add("updatedat");
          validColumns.add("isdeleted");

          Object.entries(mappedData).forEach(([key, value]) => {
            if (value !== undefined && !excludedFields.includes(key.toLowerCase())) {
              if (validColumns.has(key)) {
                record[key] = value;
              }
            }
          });

          record.updatedat = new Date().toISOString();
        });
      }
    });
  }
}
