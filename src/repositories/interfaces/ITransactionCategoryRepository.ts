import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface ITransactionCategoryRepository {
  getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]>;
  getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory>;
  createTransactionCategory(transactionCategory: Inserts<TableNames.TransactionCategories>): Promise<any>;
  updateTransactionCategory(transactionCategory: Updates<TableNames.TransactionCategories>): Promise<any>;
  deleteTransactionCategory(id: string, userId: string): Promise<any>;
  restoreTransactionCategory(id: string, userId: string): Promise<any>;
}
