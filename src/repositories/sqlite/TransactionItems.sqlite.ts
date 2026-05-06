import { TableNames } from "@/src/types/database/TableNames";
import { TransactionItem } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { ITransactionItemRepository } from "../interfaces/ITransactionItemRepository";

export class TransactionItemSqliteRepository
    extends BaseSqliteRepository<TransactionItem, TableNames.TransactionItems>
    implements ITransactionItemRepository {
    protected tableName = TableNames.TransactionItems;
    protected orderByFieldsDesc = ["createdat"];

    async findByTransactionId(transactionId: string, tenantId: string): Promise<TransactionItem[]> {
        const db = await getSqliteDB();
        const rows = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM ${this.tableName} WHERE transactionid = ? AND tenantid = ? AND isdeleted = 0 ORDER BY createdat ASC`,
            [transactionId, tenantId]
        );
        return rows.map((row) => this.mapFromRow(row));
    }
}
