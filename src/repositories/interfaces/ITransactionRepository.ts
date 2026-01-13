import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames } from "@/src/types/database/TableNames";
import {
  Inserts,
  SearchDistinctTransactions,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ITransactionRepository extends IRepository<Transaction | TransactionsView, TableNames.Transactions> {
  findAllFromView(tenantId: string, filters: TransactionFilters): Promise<TransactionsView[]>;
  findByTransferId(id: string, tenantId: string): Promise<TransactionsView>;
  findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>;
  findAllDeleted(tenantId: string, filters: TransactionFilters): Promise<Transaction[]>;

  getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number>;
  createMultiple(
    data: Inserts<TableNames.Transactions>[],
    tenantId: string,
  ): Promise<Transaction[] | TransactionsView[]>;
}
