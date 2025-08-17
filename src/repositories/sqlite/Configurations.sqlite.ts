import { eq, and, ilike } from "drizzle-orm";
import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";
import { configurations } from "../../types/db/sqllite/schema";
import type {
  Configuration,
  ConfigurationInsert,
  ConfigurationUpdate,
} from "../../types/db/sqllite/schema";

export class ConfigurationSQLiteRepository
  extends BaseSQLiteRepository<Configuration, ConfigurationInsert, ConfigurationUpdate>
  implements IConfigurationRepository
{
  protected table = configurations;

  async getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<Configuration> {
    try {
      const conditions = [
        eq(this.table.isdeleted, false),
        ilike(this.table.table, table),
        ilike(this.table.type, type),
        ilike(this.table.key, key),
      ];

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(eq(this.table.tenantid, tenantId));
      }

      const result = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .limit(1);

      if (!result[0]) {
        throw new Error(`Configuration not found for table: ${table}, type: ${type}, key: ${key}`);
      }

      return result[0] as Configuration;
    } catch (error) {
      throw new Error(`Failed to get configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}