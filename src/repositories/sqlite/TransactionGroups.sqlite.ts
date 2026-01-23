import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup } from "@/src/types/database/Tables.Types";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";

export class TransactionGroupSqliteRepository
    extends BaseSqliteRepository<TransactionGroup, TableNames.TransactionGroups>
    implements ITransactionGroupRepository {
    protected tableName = TableNames.TransactionGroups;
    protected orderByFieldsDesc = ["displayorder", "name"];
}
