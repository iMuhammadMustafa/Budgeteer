import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IAccountCategoryRepository {
  getAllAccountCategories(tenantId: string): Promise<AccountCategory[]>;
  getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory>;
  createAccountCategory(accountCategory: Inserts<TableNames.AccountCategories>): Promise<AccountCategory>;
  updateAccountCategory(accountCategory: Updates<TableNames.AccountCategories>): Promise<AccountCategory>;
  deleteAccountCategory(id: string, userId: string): Promise<AccountCategory>;
  restoreAccountCategory(id: string, userId: string): Promise<AccountCategory>;
}
