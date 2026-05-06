import { TableNames } from "@/src/types/database/TableNames";
import { SavingsBucket } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { ISavingsBucketRepository } from "../interfaces/ISavingsBucketRepository";

export class SavingsBucketSqliteRepository
    extends BaseSqliteRepository<SavingsBucket, TableNames.SavingsBuckets>
    implements ISavingsBucketRepository {
    protected tableName = TableNames.SavingsBuckets;
    protected orderByFieldsAsc = ["displayorder"];
    protected orderByFieldsDesc = ["displayorder"];
    protected orderDirection: "ASC" | "DESC" = "ASC";

    async findByAccountId(accountId: string, tenantId: string): Promise<SavingsBucket[]> {
        const db = await getSqliteDB();

        const rows = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM ${TableNames.SavingsBuckets}
       WHERE accountid = ? AND tenantid = ? AND isdeleted = 0
       ORDER BY displayorder ASC, name ASC`,
            [accountId, tenantId]
        );

        return rows.map(row => this.mapFromRow(row));
    }

    async getTotalAllocated(accountId: string, tenantId: string): Promise<number> {
        const db = await getSqliteDB();

        const result = await db.getFirstAsync<{ total: number }>(
            `SELECT COALESCE(SUM(currentamount), 0) as total
       FROM ${TableNames.SavingsBuckets}
       WHERE accountid = ? AND tenantid = ? AND isdeleted = 0`,
            [accountId, tenantId]
        );

        return result?.total ?? 0;
    }
}
