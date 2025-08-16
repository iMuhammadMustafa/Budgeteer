import { Transaction, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";

export interface ITransactionRepository {
  getAllTransactions(tenantId: string): Promise<any[]>;
  getTransactions(searchFilters: TransactionFilters, tenantId: string): Promise<any[]>;
  getTransactionFullyById(transactionid: string, tenantId: string): Promise<any>;
  getTransactionById(transactionid: string, tenantId: string): Promise<Transaction>;
  getTransactionByTransferId(id: string, tenantId: string): Promise<any>;
  getTransactionsByName(text: string, tenantId: string): Promise<{ label: string; item: any }[]>;
  createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any>;
  createTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]>;
  createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<any[]>;
  updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>;
  updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>;
  deleteTransaction(id: string, userId: string): Promise<any>;
  restoreTransaction(id: string, userId: string): Promise<any>;
}
