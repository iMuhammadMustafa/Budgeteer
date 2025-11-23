import { TableNames } from "@/src/types/database/TableNames";
import { Configuration as ConfigurationType } from "@/src/types/database/Tables.Types";
import { Configuration } from "@/src/types/database/watermelon/models";
import { Q } from "@nozbe/watermelondb";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";
import { mapConfigurationFromWatermelon } from "./TypeMappers";

export class ConfigurationWatermelonRepository
  extends BaseWatermelonRepository<Configuration, TableNames.Configurations, ConfigurationType>
  implements IConfigurationRepository
{
  protected tableName = TableNames.Configurations;

  protected override mapFromWatermelon(model: Configuration): ConfigurationType {
    return mapConfigurationFromWatermelon(model);
  }

  async getConfiguration(table: string, type: string, key: string, tenantId: string): Promise<ConfigurationType> {
    const db = await this.getDb();

    const results = await db
      .get(this.tableName)
      .query(
        Q.where("tablename", table),
        Q.where("type", type),
        Q.where("key", key),
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
      );
    const model = results[0] as Configuration | undefined;

    if (!model) {
      throw new Error(`Configuration not found for table: ${table}, type: ${type}, key: ${key}`);
    }

    return this.mapFromWatermelon(model);
  }
}
