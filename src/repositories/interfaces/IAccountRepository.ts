import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { Account } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface IAccountRepository extends IRepository<Account, TableNames.Accounts> {
  findAllWithCategory(tenantId: string, filters?: QueryFilters): Promise<Account[]>;
  findByIdWithBalance(id: string, tenantId: string): Promise<(Account & { runningbalance: number }) | null>;
  updateAccountBalance(accountid: string, amount: number, tenantId: string): Promise<number>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
  getAccountRunningBalance(accountid: string, tenantId: string): Promise<{ runningbalance: number } | null>;
}
