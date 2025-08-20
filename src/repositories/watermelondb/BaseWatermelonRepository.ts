import { Model, Q } from "@nozbe/watermelondb";
import { getWatermelonDB } from "../../database";
import { IRepository } from "../interfaces/IRepository";

export abstract class BaseWatermelonRepository<T extends Model, InsertType, UpdateType, MappedType = any>
  implements IRepository<MappedType, InsertType, UpdateType>
{
  // Abstract properties that concrete repositories must define
  protected abstract tableName: string;
  protected abstract modelClass: typeof Model;

  // Abstract method for mapping WatermelonDB models to the expected type
  protected abstract mapFromWatermelon(model: T): MappedType;

  // Optional method for custom field mapping during create/update
  protected mapFieldsForDatabase(data: Record<string, any>): Record<string, any> {
    return data;
  }

  // Optional method to get tenant field name (different repositories use different conventions)
  protected getTenantFieldName(): string {
    return "tenantid";
  }

  // Optional method to get soft delete field name
  protected getSoftDeleteFieldName(): string {
    return "isdeleted";
  }

  protected async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<MappedType | null> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const query = db.get(this.tableName).query(
        Q.where("id", id),
        // Add tenant filtering if tenantId is provided
        ...(tenantId ? [Q.where(tenantField, tenantId)] : []),
        // Add soft delete filtering
        Q.where(softDeleteField, false),
      );

      const results = await query;
      const model = results[0] as T;
      return model ? this.mapFromWatermelon(model) : null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<MappedType[]> {
    try {
      const db = await this.getDb();
      const conditions = [];
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const collection = db.get(this.tableName);
      if (!collection) {
        throw new Error(
          `Collection "${this.tableName}" not found in WatermelonDB. Check your tableName and model registration.`,
        );
      }

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(Q.where(tenantField, tenantId));
      }

      // Add soft delete filtering
      conditions.push(Q.where(softDeleteField, false));

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
      return (results as T[]).map(model => this.mapFromWatermelon(model));
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: InsertType, tenantId?: string): Promise<MappedType> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      return await db.write(async () => {
        const mappedData = this.mapFieldsForDatabase(data as Record<string, any>);

        const record = await db.get(this.tableName).create((record: any) => {
          if (tenantId) {
            record[tenantField] = tenantId;
            record.createdby = tenantId;
            record.updatedby = tenantId;
          }

          // Set all provided data
          Object.entries(mappedData).forEach(([key, value]) => {
            if (key !== "id" && value !== undefined) {
              record[key] = value;
            }
          });

          // Set timestamps
          const now = new Date().toISOString();
          record[softDeleteField] = false;
          record.createdat = now;
          record.updatedat = now;
        });

        return this.mapFromWatermelon(record as T);
      });
    } catch (error) {
      console.error("Create error:", error);
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: UpdateType, tenantId?: string): Promise<MappedType | null> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        // Add tenant filtering if tenantId is provided
        if (tenantId) {
          conditions.push(Q.where(tenantField, tenantId));
        }

        // Add soft delete filtering
        conditions.push(Q.where(softDeleteField, false));

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          return null;
        }

        const mappedData = this.mapFieldsForDatabase(data as Record<string, any>);

        const updatedRecord = await record.update((record: any) => {
          try {
            // Fields that should not be updated directly
            const excludedFields = ["id", "createdat", "createdby", tenantField];

            // Set all provided data except excluded fields
            Object.entries(mappedData).forEach(([key, value]) => {
              if (value !== undefined && !excludedFields.includes(key.toLowerCase())) {
                record[key] = value;
              }
            });

            // Update timestamp and updatedBy
            record.updatedat = new Date().toISOString();
            if (tenantId) {
              record.updatedby = tenantId;
            }
          } catch (err) {
            console.error("Error in update callback:", err);
            throw err;
          }
        });

        return this.mapFromWatermelon(updatedRecord as T);
      });
    } catch (error) {
      console.error("Update error:", error);
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
          conditions.push(Q.where("tenantid", tenantId));
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
          conditions.push(Q.where("tenantid", tenantId));
        }

        // Add soft delete filtering
        conditions.push(Q.where("isdeleted", false));

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isdeleted = true;
            record.updatedat = new Date().toISOString();
            if (tenantId) {
              record.updatedby = tenantId;
            }
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
          conditions.push(Q.where("tenantid", tenantId));
        }

        const query = db.get(this.tableName).query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isdeleted = false;
            record.updatedat = new Date().toISOString();
            if (tenantId) {
              record.updatedby = tenantId;
            }
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Helper method to convert camelCase to snake_case
  protected camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Helper method to convert snake_case to camelCase
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
