import { TableNames } from "@/src/types/database/TableNames";
import { SearchDistinctTransactions, Transaction, TransactionsView, Updates } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ITransactionRepository extends IRepository<Transaction | TransactionsView, TableNames.Transactions> {
  findByTransferId(id: string, tenantId: string): Promise<TransactionsView>;
  findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>;

  getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number>;
}
