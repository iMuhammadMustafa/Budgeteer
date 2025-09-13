import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";

export class AccountCategorySupaRepository
  extends SupaRepository<AccountCategory, TableNames.AccountCategories>
  implements IAccountCategoryRepository
{
  protected tableName = TableNames.AccountCategories;
}
