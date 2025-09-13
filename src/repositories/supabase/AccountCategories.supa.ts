import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory } from "@/src/types/database/Tables.Types";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";
import { SupaRepository } from "../SupaRepository";

export class AccountCategorySupaRepository
  extends SupaRepository<AccountCategory, TableNames.AccountCategories>
  implements IAccountCategoryRepository
{
  constructor() {
    super(TableNames.AccountCategories);
  }
}
