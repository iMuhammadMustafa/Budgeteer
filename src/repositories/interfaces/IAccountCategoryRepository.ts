import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IAccountCategoryRepository {
  getAllAccountCategories(tenantId: string): Promise<AccountCategory[]>;
  getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory>;
  createAccountCategory(accountCategory: Inserts<TableNames.AccountCategories>): Promise<any>;
  updateAccountCategory(accountCategory: Updates<TableNames.AccountCategories>): Promise<any>;
  deleteAccountCategory(id: string, userId: string): Promise<any>;
  restoreAccountCategory(id: string, userId: string): Promise<any>;
}
