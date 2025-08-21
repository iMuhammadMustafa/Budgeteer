import { ITransactionGroupRepository } from "../interfaces/ITransactionGroupRepository";
import { TransactionGroup } from "../../database/models";
import { TransactionGroup as TransactionGroupType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapTransactionGroupFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";

export class TransactionGroupWatermelonRepository
  extends BaseWatermelonRepository<
    TransactionGroup,
    Inserts<TableNames.TransactionGroups>,
    Updates<TableNames.TransactionGroups>,
    TransactionGroupType
  >
  implements ITransactionGroupRepository
{
  protected tableName = TableNames.TransactionGroups;
  protected modelClass = TransactionGroup;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: TransactionGroup): TransactionGroupType {
    return mapTransactionGroupFromWatermelon(model);
  }
  protected mapFieldsForDatabase(data: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case "budgetamount":
          mapped[key] = Number(value) || 0;
          break;
        default:
          mapped[key] = value;
      }
    });

    return mapped;
  }
}
