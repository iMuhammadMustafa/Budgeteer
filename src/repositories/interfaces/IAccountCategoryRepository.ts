import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface IAccountCategoryRepository
  extends IRepository<AccountCategory, Inserts<TableNames.AccountCategories>, Updates<TableNames.AccountCategories>> {}
