import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface IAccountCategoryRepository extends IRepository<AccountCategory, TableNames.AccountCategories> {}
