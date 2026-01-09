import { TableNames } from "@/src/types/database/TableNames";
import { Configuration } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { configurations } from "@/src/types/database/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { IConfigurationRepository } from "../interfaces/IConfigurationRepository";

export class ConfigurationDrizzleRepository
    extends BaseDrizzleRepository<
        typeof configurations,
        TableNames.Configurations,
        Configuration
    >
    implements IConfigurationRepository {
    protected table = configurations;
    protected tableName = TableNames.Configurations;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }

    async getConfiguration(
        table: string,
        type: string,
        key: string,
        tenantId: string
    ): Promise<Configuration> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(this.tableName)
                .select()
                .eq("tablename", table)
                .eq("type", type)
                .eq("key", key)
                .eq("tenantid", tenantId)
                .eq("isdeleted", false)
                .single();

            if (error) throw error;
            return data as Configuration;
        }

        const db = this.getSqliteDb();
        const results = await (db as any)
            .select()
            .from(this.table)
            .where(
                and(
                    eq(this.table.tablename, table),
                    eq(this.table.type, type),
                    eq(this.table.key, key),
                    eq(this.table.tenantid, tenantId),
                    eq(this.table.isdeleted, false)
                )
            )
            .limit(1);

        if (!results[0]) throw new Error(`Configuration not found: ${table}/${type}/${key}`);
        return results[0] as Configuration;
    }
}
