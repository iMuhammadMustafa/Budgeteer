import { TableNames } from "@/src/types/database/TableNames";
import { TransactionItem } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ITransactionItemRepository extends IRepository<TransactionItem, TableNames.TransactionItems> {
  findByTransactionId(transactionId: string, tenantId: string): Promise<TransactionItem[]>;
}
