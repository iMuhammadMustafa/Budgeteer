import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { recurrings, Recurring, RecurringInsert, RecurringUpdate } from "../../types/db/sqllite/schema";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

export class RecurringSQLiteRepository 
  extends BaseSQLiteRepository<Recurring, RecurringInsert, RecurringUpdate>
  implements IRecurringRepository {

  protected table = recurrings;
}