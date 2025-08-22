import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface ITransactionCategoryRepository
  extends IRepository<
    TransactionCategory,
    Inserts<TableNames.TransactionCategories>,
    Updates<TableNames.TransactionCategories>
  > {}
