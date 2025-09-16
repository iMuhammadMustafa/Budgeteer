import { TableNames } from "@/src/types/database/TableNames";
import { Account } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface IAccountRepository extends IRepository<Account, TableNames.Accounts> {
  updateAccountBalance(accountid: string, amount: number, tenantId: string): Promise<number>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}
