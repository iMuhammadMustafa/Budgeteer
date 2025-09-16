import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory as AccountCategoryType } from "@/src/types/database/Tables.Types";
import { AccountCategory } from "@/src/types/database/watermelon/models";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";

export class AccountCategoryWatermelonRepository
  extends BaseWatermelonRepository<AccountCategory, TableNames.AccountCategories, AccountCategoryType>
  implements IAccountCategoryRepository
{
  protected tableName = TableNames.AccountCategories;
}
