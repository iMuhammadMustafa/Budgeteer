import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRepository } from "./IRepository";

export interface IRecurringRepository
  extends IRepository<Recurring, Inserts<TableNames.Recurrings>, Updates<TableNames.Recurrings>> {}
