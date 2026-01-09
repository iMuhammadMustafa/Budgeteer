import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { transactionCategories } from "@/src/types/database/drizzle/schema";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategoryDrizzleRepository
    extends BaseDrizzleRepository<
        typeof transactionCategories,
        TableNames.TransactionCategories,
        TransactionCategory
    >
    implements ITransactionCategoryRepository {
    protected table = transactionCategories;
    protected tableName = TableNames.TransactionCategories;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }
}
