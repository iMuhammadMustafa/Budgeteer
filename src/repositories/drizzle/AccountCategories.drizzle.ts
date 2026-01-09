import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { accountCategories } from "@/src/types/database/drizzle/schema";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";

export class AccountCategoryDrizzleRepository
    extends BaseDrizzleRepository<
        typeof accountCategories,
        TableNames.AccountCategories,
        AccountCategory
    >
    implements IAccountCategoryRepository {
    protected table = accountCategories;
    protected tableName = TableNames.AccountCategories;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }
}
