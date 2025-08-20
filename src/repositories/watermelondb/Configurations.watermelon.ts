import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";
import { Configuration } from "../../database/models";
import { Configuration as ConfigurationType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapConfigurationFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class ConfigurationWatermelonRepository
  extends BaseWatermelonRepository<
    Configuration,
    Inserts<TableNames.Configurations>,
    Updates<TableNames.Configurations>,
    ConfigurationType
  >
  implements IConfigurationRepository
{
  protected tableName = "configurations";
  protected modelClass = Configuration;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: Configuration): ConfigurationType {
    return mapConfigurationFromWatermelon(model);
  }

  // Specialized method for Configuration repository
  async getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<ConfigurationType> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const conditions = [
        Q.where("table", table),
        Q.where("type", type),
        Q.where("key", key),
        Q.where(softDeleteField, false),
      ];

      if (tenantId) {
        conditions.push(Q.where(tenantField, tenantId));
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;
      const model = results[0] as Configuration | undefined;

      if (!model) {
        throw new Error(`Configuration not found for table: ${table}, type: ${type}, key: ${key}`);
      }

      return this.mapFromWatermelon(model);
    } catch (error) {
      throw new Error(`Failed to get configuration: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
