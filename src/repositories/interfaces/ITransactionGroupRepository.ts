import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup } from "@/src/types/database/Tables.Types";
import { IRepository } from "./IRepository";

export interface ITransactionGroupRepository extends IRepository<TransactionGroup, TableNames.TransactionGroups> {}
