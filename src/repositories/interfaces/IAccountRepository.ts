import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IAccountRepository {
  getAllAccounts(tenantId: string): Promise<Account[]>;
  getAccountById(id: string, tenantId: string): Promise<Account | null>;
  createAccount(account: Inserts<TableNames.Accounts>): Promise<any>;
  updateAccount(account: Updates<TableNames.Accounts>): Promise<any>;
  deleteAccount(id: string, userId?: string): Promise<any>;
  restoreAccount(id: string, userId?: string): Promise<any>;
  updateAccountBalance(accountid: string, amount: number): Promise<any>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}
