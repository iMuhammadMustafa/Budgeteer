import { TableNames } from "@/src/types/database/TableNames";
import { TransactionGroup } from "@/src/types/database/Tables.Types";
import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";
import { SupaRepository } from "../SupaRepository";

export class TransactionGroupSupaRepository
  extends SupaRepository<TransactionGroup, TableNames.TransactionGroups>
  implements ITransactionGroupRepository
{
  constructor() {
    super(TableNames.TransactionGroups);
  }
}
