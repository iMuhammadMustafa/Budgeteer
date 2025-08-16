import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";

export interface ITransactionGroupRepository {
  getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]>;
  getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup>;
  createTransactionGroup(transactionGroup: Inserts<TableNames.TransactionGroups>): Promise<TransactionGroup>;
  updateTransactionGroup(transactionGroup: Updates<TableNames.TransactionGroups>): Promise<TransactionGroup>;
  deleteTransactionGroup(id: string, userId: string): Promise<TransactionGroup>;
  restoreTransactionGroup(id: string, userId: string): Promise<TransactionGroup>;
}
