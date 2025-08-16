import {
  Transaction,
  Inserts,
  Updates,
  TransactionsView,
  SearchDistinctTransactions,
} from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";

export interface ITransactionRepository {
  getAllTransactions(tenantId: string): Promise<TransactionsView[]>;
  getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]>;
  getTransactionFullyById(transactionid: string, tenantId: string): Promise<TransactionsView>;
  getTransactionById(transactionid: string, tenantId: string): Promise<Transaction>;
  getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView>;
  getTransactionsByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<Transaction>;
  createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]>;
  createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]>;
  updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>;
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>;
  deleteTransaction(id: string, userId: string): Promise<Transaction>;
  restoreTransaction(id: string, userId: string): Promise<Transaction[]>;
}
