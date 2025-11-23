import { Model, Q } from "@nozbe/watermelondb";
import { TableNames } from "../types/database/TableNames";
import { Inserts, Updates } from "../types/database/Tables.Types";
import { getWatermelonDB } from "../types/database/watermelon";
import { getDefaultTenantId } from "../types/database/watermelon/constants";
import { IRepository } from "./interfaces/IRepository";

export abstract class BaseWatermelonRepository<TModel extends Model, TTable extends TableNames, TMapped>
  implements IRepository<TMapped, TTable>
{
  // Abstract properties that concrete repositories must define
  protected abstract tableName: string;

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
    conditions.push(Q.where("isdeleted", false));

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    const query = db.get(this.tableName).query(...conditions);
    const results = await query;

    return (results as TModel[]).map(model => this.mapFromWatermelon(model));
  }

  async create(data: Inserts<TTable>, tenantId: string): Promise<TMapped> {
    const db = await this.getDb();

    return await db.write(async () => {
      const mappedData = this.mapFieldsForWatermelon(data as Record<string, any>);

      const record = await db.get(this.tableName).create((record: any) => {
        Object.entries(mappedData).forEach(([key, value]) => {
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

        Object.entries(mappedData).forEach(([key, value]) => {
          if (value !== undefined && !excludedFields.includes(key.toLowerCase())) {
            record[key] = value;
          }
        });

        record.updatedat = new Date().toISOString();
      });

      return updatedRecord ? this.mapFromWatermelon(updatedRecord as TModel) : null;
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
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
}
