import { Account, Inserts, Updates, StatsTotalAccountBalance } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface IAccountRepository {
  getAllAccounts(tenantId: string): Promise<Account[]>;
  getAccountById(id: string, tenantId: string): Promise<Account | null>;
  createAccount(account: Inserts<TableNames.Accounts>): Promise<Account>;
  updateAccount(account: Updates<TableNames.Accounts>): Promise<Account>;
  deleteAccount(id: string, userId?: string): Promise<Account>;
  restoreAccount(id: string, userId?: string): Promise<Account>;
  updateAccountBalance(accountid: string, amount: number): Promise<number>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}
