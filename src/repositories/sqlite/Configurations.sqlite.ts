import { TableNames } from "@/src/types/database/TableNames";
import { Configuration } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";

export class ConfigurationSqliteRepository
    extends BaseSqliteRepository<Configuration, TableNames.Configurations>
    implements IConfigurationRepository {
    protected tableName = TableNames.Configurations;
    protected orderByField?: string = undefined;
    protected orderDirection?: "ASC" | "DESC" = undefined;

    async getConfiguration(
        table: string,
        type: string,
        key: string,
        tenantId: string
    ): Promise<Configuration> {
        const db = await getSqliteDB();

        const row = await db.getFirstAsync<Record<string, unknown>>(
            `SELECT * FROM ${TableNames.Configurations} 
       WHERE "table" = ? AND type = ? AND key = ? AND tenantid = ? AND isdeleted = 0`,
            [table, type, key, tenantId]
        );

        if (!row) {
            throw new Error(`Configuration not found: ${table}.${type}.${key}`);
        }

        return this.mapFromRow(row);
    }
}
