import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup as TransactionGroupType } from "@/src/types/database/Tables.Types";
import { TransactionGroup } from "@/src/types/database/watermelon/models";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";

export class TransactionGroupWatermelonRepository
  extends BaseWatermelonRepository<TransactionGroup, TableNames.TransactionGroups, TransactionGroupType>
  implements ITransactionGroupRepository
{
  protected tableName = TableNames.TransactionGroups;
}
