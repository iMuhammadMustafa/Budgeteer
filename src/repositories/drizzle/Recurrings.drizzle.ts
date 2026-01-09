import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { recurrings } from "@/src/types/database/drizzle/schema";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

export class RecurringDrizzleRepository
    extends BaseDrizzleRepository<
        typeof recurrings,
        TableNames.Recurrings,
        Recurring
    >
    implements IRecurringRepository {
    protected table = recurrings;
    protected tableName = TableNames.Recurrings;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }
}
