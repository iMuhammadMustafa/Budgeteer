import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup } from "@/src/types/database/Tables.Types";
import { SupaRepository } from "../BaseSupaRepository";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";

export class TransactionGroupSupaRepository
  extends SupaRepository<TransactionGroup, TableNames.TransactionGroups>
  implements ITransactionGroupRepository
{
  constructor() {
    super(TableNames.TransactionGroups);
  }
}
