import { IAccountCategoryRepository } from "../interfaces/IAccountCategoryRepository";
import { AccountCategory } from "../../database/models";
import { AccountCategory as AccountCategoryType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapAccountCategoryFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";

export class AccountCategoryWatermelonRepository
  extends BaseWatermelonRepository<
    AccountCategory,
    Inserts<TableNames.AccountCategories>,
    Updates<TableNames.AccountCategories>,
    AccountCategoryType
  >
  implements IAccountCategoryRepository
{
  protected tableName = TableNames.AccountCategories;
  protected modelClass = AccountCategory;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: AccountCategory): AccountCategoryType {
    return mapAccountCategoryFromWatermelon(model);
  }
}
