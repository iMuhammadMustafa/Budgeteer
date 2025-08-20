import { IRecurringRepository } from "../interfaces/IRecurringRepository";
import { Recurring } from "../../database/models";
import { Recurring as RecurringType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapRecurringFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";

export class RecurringWatermelonRepository
  extends BaseWatermelonRepository<
    Recurring,
    Inserts<TableNames.Recurrings>,
    Updates<TableNames.Recurrings>,
    RecurringType
  >
  implements IRecurringRepository
{
  protected tableName = "recurrings";
  protected modelClass = Recurring;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: Recurring): RecurringType {
    return mapRecurringFromWatermelon(model);
  }
}
