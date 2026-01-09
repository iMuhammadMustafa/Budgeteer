import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { transactionGroups } from "@/src/types/database/drizzle/schema";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";

export class TransactionGroupDrizzleRepository
    extends BaseDrizzleRepository<
        typeof transactionGroups,
        TableNames.TransactionGroups,
        TransactionGroup
    >
    implements ITransactionGroupRepository {
    protected table = transactionGroups;
    protected tableName = TableNames.TransactionGroups;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }
}
