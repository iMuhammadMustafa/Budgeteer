import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory, TransactionGroup } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { ITransactionCategoryRepository } from "../interfaces/ITransactionCategoryRepository";

export class TransactionCategorySqliteRepository
    extends BaseSqliteRepository<TransactionCategory, TableNames.TransactionCategories>
    implements ITransactionCategoryRepository {
    protected tableName = TableNames.TransactionCategories;
    protected orderByField = "displayorder";
    protected orderDirection: "ASC" | "DESC" = "DESC";

    async findAllWithGroup(tenantId: string, filters?: QueryFilters): Promise<TransactionCategory[]> {
        const db = await getSqliteDB();

        let query = `
      SELECT 
        tc.*,
        tg.id AS group_id,
        tg.name AS group_name,
        tg.type AS group_type,
        tg.color AS group_color,
        tg.icon AS group_icon,
        tg.description AS group_description,
        tg.displayorder AS group_displayorder,
        tg.budgetamount AS group_budgetamount,
        tg.budgetfrequency AS group_budgetfrequency
      FROM ${TableNames.TransactionCategories} tc
      LEFT JOIN ${TableNames.TransactionGroups} tg ON tc.groupid = tg.id
      WHERE tc.tenantid = ?
    `;
        const params: unknown[] = [tenantId];

        // isDeleted filter
        if (filters?.isDeleted === null) {
            // No filter
        } else if (filters?.isDeleted === true) {
            query += ` AND tc.isdeleted = 1`;
        } else {
            query += ` AND tc.isdeleted = 0`;
        }

        query += ` ORDER BY tc.displayorder DESC, tc.name`;

        const rows = await db.getAllAsync<Record<string, unknown>>(query, params);

        return rows.map((row) => {
            const category = this.mapFromRow(row);

            // Attach group if available
            if (row.group_id) {
                (category as TransactionCategory).group = {
                    id: row.group_id as string,
                    name: row.group_name as string,
                    type: row.group_type as TransactionGroup["type"],
                    color: row.group_color as string,
                    icon: row.group_icon as string,
                    description: row.group_description as string | null,
                    displayorder: row.group_displayorder as number,
                    budgetamount: row.group_budgetamount as number,
                    budgetfrequency: row.group_budgetfrequency as string,
                    tenantid: tenantId,
                    isdeleted: false,
                    createdat: "",
                    createdby: null,
                    updatedat: null,
                    updatedby: null,
                };
            }

            return category;
        });
    }
}
