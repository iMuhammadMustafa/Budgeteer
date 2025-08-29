import {
  Transaction,
  Inserts,
  Updates,
  TransactionsView,
  SearchDistinctTransactions,
} from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { IRepository } from "./IRepository";

export interface ITransactionRepository
  extends IRepository<
    Transaction | TransactionsView,
    Inserts<TableNames.Transactions>,
    Updates<TableNames.Transactions>
  > {
  findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]>;
  getByTransferId(id: string, tenantId: string): Promise<TransactionsView>;
  findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]>;
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>;

  // Statement balance calculation methods
  findByAccountInDateRange(
    accountId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TransactionsView[]>;
  getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number>;
}
