import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface ITransactionGroupRepository
  extends IRepository<TransactionGroup, Inserts<TableNames.TransactionGroups>, Updates<TableNames.TransactionGroups>> {}
