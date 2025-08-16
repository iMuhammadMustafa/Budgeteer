import { Account, Inserts, Updates, StatsTotalAccountBalance } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface IAccountRepository
  extends IRepository<Account, Inserts<TableNames.Accounts>, Updates<TableNames.Accounts>> {
  updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number>;
  getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId?: string): Promise<{ totalbalance: number } | null>;
}
