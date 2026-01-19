import { TableNames } from "@/src/types/database/TableNames";
import { Recurring } from "@/src/types/database/Tables.Types";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { IRecurringRepository } from "../interfaces/IRecurringRepository";

export class RecurringSqliteRepository
    extends BaseSqliteRepository<Recurring, TableNames.Recurrings>
    implements IRecurringRepository {
    protected tableName = TableNames.Recurrings;
    protected orderByField = "nextoccurrencedate";
    protected orderDirection: "ASC" | "DESC" = "ASC";

    /**
     * Override mapFromRow to handle the type field for recurring
     */
    protected override mapFromRow(row: Record<string, unknown>): Recurring {
        const mapped = super.mapFromRow(row) as Record<string, unknown>;

        // Convert SQLite integers to booleans
        if ("isactive" in mapped) {
            mapped.isactive = mapped.isactive === 1 || mapped.isactive === true;
        }
        if ("isamountflexible" in mapped) {
            mapped.isamountflexible = mapped.isamountflexible === 1 || mapped.isamountflexible === true;
        }
        if ("isdateflexible" in mapped) {
            mapped.isdateflexible = mapped.isdateflexible === 1 || mapped.isdateflexible === true;
        }
        if ("autoapplyenabled" in mapped) {
            mapped.autoapplyenabled = mapped.autoapplyenabled === 1 || mapped.autoapplyenabled === true;
        }

        return mapped as Recurring;
    }

    /**
     * Override mapToRow to handle boolean to integer conversion
     */
    protected override mapToRow(data: Record<string, unknown>): Record<string, unknown> {
        const mapped = super.mapToRow(data);

        if ("isactive" in mapped) {
            mapped.isactive = mapped.isactive ? 1 : 0;
        }
        if ("isamountflexible" in mapped) {
            mapped.isamountflexible = mapped.isamountflexible ? 1 : 0;
        }
        if ("isdateflexible" in mapped) {
            mapped.isdateflexible = mapped.isdateflexible ? 1 : 0;
        }
        if ("autoapplyenabled" in mapped) {
            mapped.autoapplyenabled = mapped.autoapplyenabled ? 1 : 0;
        }

        return mapped;
    }
}
