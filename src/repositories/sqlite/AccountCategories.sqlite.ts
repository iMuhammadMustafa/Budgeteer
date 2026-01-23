import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory } from "@/src/types/database/Tables.Types";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";

export class AccountCategorySqliteRepository
    extends BaseSqliteRepository<AccountCategory, TableNames.AccountCategories>
    implements IAccountCategoryRepository {
    protected tableName = TableNames.AccountCategories;
    protected orderByFieldsAsc = ["displayorder"];
    protected orderByFieldsDesc = ["displayorder"];
    protected orderDirection: "ASC" | "DESC" = "DESC";
}
