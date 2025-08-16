import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface ITransactionCategoryRepository {
  getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]>;
  getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory>;
  createTransactionCategory(
    transactionCategory: Inserts<TableNames.TransactionCategories>,
  ): Promise<TransactionCategory>;
  updateTransactionCategory(
    transactionCategory: Updates<TableNames.TransactionCategories>,
  ): Promise<TransactionCategory>;
  deleteTransactionCategory(id: string, userId: string): Promise<TransactionCategory>;
  restoreTransactionCategory(id: string, userId: string): Promise<TransactionCategory>;
}
