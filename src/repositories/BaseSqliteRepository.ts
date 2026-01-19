import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { getCurrentTimestamp } from "@/src/types/database/sqlite/constants";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { SQLiteBindValue } from "expo-sqlite";
import { IRepository } from "./interfaces/IRepository";

export abstract class BaseSqliteRepository<TModel, TTable extends TableNames>
    implements IRepository<TModel, TTable> {
    protected abstract tableName: TableNames;
    protected abstract orderByFieldsDesc?: string[];

    /**
     * Map a database row to the model type
     * Override in subclass if custom mapping is needed
     */
    protected mapFromRow(row: Record<string, unknown>): TModel {
        // Convert SQLite integers to booleans for isdeleted and isvoid
        const mapped = { ...row };
        if ("isdeleted" in mapped) {
            mapped.isdeleted = mapped.isdeleted === 1 || mapped.isdeleted === true;
        }
        if ("isvoid" in mapped) {
            mapped.isvoid = mapped.isvoid === 1 || mapped.isvoid === true;
        }
        // Parse tags JSON if present
        if ("tags" in mapped && typeof mapped.tags === "string") {
            try {
                mapped.tags = JSON.parse(mapped.tags);
            } catch {
                mapped.tags = null;
            }
        }
        return mapped as TModel;
    }

    /**
     * Map model fields to database columns
     * Override in subclass if custom mapping is needed
     */
    protected mapToRow(data: Record<string, unknown>): Record<string, unknown> {
        const mapped = { ...data };
        // Convert booleans to integers for SQLite
        if ("isdeleted" in mapped) {
            mapped.isdeleted = mapped.isdeleted ? 1 : 0;
        }
        if ("isvoid" in mapped) {
            mapped.isvoid = mapped.isvoid ? 1 : 0;
        }
        // Stringify tags array if present
        if ("tags" in mapped && Array.isArray(mapped.tags)) {
            mapped.tags = JSON.stringify(mapped.tags);
        }
        return mapped;
    }

    /**
     * Cache for table column names - static to be shared across instances
     */
    private static columnCache: Map<string, string[]> = new Map();

    /**
     * Get the column names for this table from the schema
     * Results are cached to avoid repeated PRAGMA calls
     */
    protected async getTableColumns(): Promise<string[]> {
        // Check cache first
        if (BaseSqliteRepository.columnCache.has(this.tableName)) {
            return BaseSqliteRepository.columnCache.get(this.tableName)!;
        }

        const db = await getSqliteDB();
        const columns = await db.getAllAsync<{ name: string }>(
            `PRAGMA table_info(${this.tableName})`
        );
        const columnNames = columns.map((c) => c.name.toLowerCase());

        // Cache the result
        BaseSqliteRepository.columnCache.set(this.tableName, columnNames);
        return columnNames;
    }

    /**
     * Filter data to only include columns that exist in the table schema
     * This prevents errors when forms include extra fields not in the database
     */
    protected async filterToSchemaColumns(
        data: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
        const allowedColumns = await this.getTableColumns();
        return Object.fromEntries(
            Object.entries(data).filter(([key]) =>
                allowedColumns.includes(key.toLowerCase())
            )
        );
    }

    /**
     * Clear the column cache (useful for testing or schema changes)
     */
    public static clearColumnCache(): void {
        BaseSqliteRepository.columnCache.clear();
    }

    async findById(id: string, tenantId: string): Promise<TModel | null> {
        const db = await getSqliteDB();
        const row = await db.getFirstAsync<Record<string, unknown>>(
            `SELECT * FROM ${this.tableName} WHERE id = ? AND tenantid = ? AND isdeleted = 0`,
            [id, tenantId]
        );
        return row ? this.mapFromRow(row) : null;
    }

    async findAll(tenantId: string, filters?: QueryFilters): Promise<TModel[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${this.tableName} WHERE tenantid = ?`;
        const params: SQLiteBindValue[] = [tenantId];

        // isDeleted filter
        if (filters?.isDeleted === null) {
            // No filter - show all records
        } else if (filters?.isDeleted === true) {
            query += ` AND isdeleted = 1`;
        } else {
            // Default: show non-deleted only
            query += ` AND isdeleted = 0`;
        }

        // Date range filters
        if (filters?.startDate) {
            query += ` AND createdat >= ?`;
            params.push(filters.startDate);
        }
        if (filters?.endDate) {
            query += ` AND createdat <= ?`;
            params.push(filters.endDate);
        }

        // Order by
        if (this.orderByFieldsDesc && this.orderByFieldsDesc.length > 0) {
            const orderClauses = this.orderByFieldsDesc.map(field => `${field} DESC`).join(", ");
            query += ` ORDER BY ${orderClauses}`;
        }

        // Pagination
        if (filters?.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }
        if (filters?.offset) {
            query += ` OFFSET ?`;
            params.push(filters.offset);
        }

        const rows = await db.getAllAsync<Record<string, unknown>>(query, params);
        return rows.map((row) => this.mapFromRow(row));
    }

    async create(data: Inserts<TTable>, tenantId: string): Promise<TModel> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();

        // Build record with required fields
        const rawRecord = this.mapToRow({
            ...data,
            id: (data as Record<string, unknown>).id || GenerateUuid(),
            tenantid: tenantId,
            isdeleted: 0,
            createdat: (data as Record<string, unknown>).createdat || now,
            updatedat: (data as Record<string, unknown>).updatedat || now,
        });

        // Filter to only columns that exist in the schema
        const record = await this.filterToSchemaColumns(rawRecord);

        const columns = Object.keys(record);
        const placeholders = columns.map(() => "?").join(", ");
        const values = columns.map((col) => record[col]) as SQLiteBindValue[];

        await db.runAsync(
            `INSERT INTO ${this.tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
            values
        );

        return this.mapFromRow(record) as TModel;
    }

    async update(id: string, data: Updates<TTable>, tenantId: string): Promise<TModel | null> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();

        // Exclude immutable fields
        const { id: _id, tenantid: _tenantid, createdat: _createdat, createdby: _createdby, ...updateData } = data as Record<string, unknown>;

        const rawRecord = this.mapToRow({
            ...updateData,
            updatedat: now,
        });

        // Filter to only columns that exist in the schema
        const record = await this.filterToSchemaColumns(rawRecord);

        const columns = Object.keys(record);
        if (columns.length === 0) {
            return this.findById(id, tenantId);
        }

        const setClause = columns.map((col) => `${col} = ?`).join(", ");
        const values = [...columns.map((col) => record[col]), id, tenantId] as SQLiteBindValue[];

        const result = await db.runAsync(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ? AND tenantid = ? AND isdeleted = 0`,
            values
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id, tenantId);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        return this.softDelete(id, tenantId);
    }

    async hardDelete(id: string, tenantId: string): Promise<void> {
        const db = await getSqliteDB();
        await db.runAsync(`DELETE FROM ${this.tableName} WHERE id = ? AND tenantid = ?`, [id, tenantId]);
    }

    async softDelete(id: string, tenantId: string): Promise<void> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();
        await db.runAsync(
            `UPDATE ${this.tableName} SET isdeleted = 1, updatedat = ? WHERE id = ? AND tenantid = ? AND isdeleted = 0`,
            [now, id, tenantId]
        );
    }

    async restore(id: string, tenantId: string): Promise<void> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();
        await db.runAsync(
            `UPDATE ${this.tableName} SET isdeleted = 0, updatedat = ? WHERE id = ? AND tenantid = ? AND isdeleted = 1`,
            [now, id, tenantId]
        );
    }

    async createMultiple(data: Inserts<TTable>[], tenantId: string): Promise<TModel[]> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();
        const results: TModel[] = [];

        for (const item of data) {
            const rawRecord = this.mapToRow({
                ...item,
                id: (item as Record<string, unknown>).id || GenerateUuid(),
                tenantid: tenantId,
                isdeleted: 0,
                createdat: (item as Record<string, unknown>).createdat || now,
                updatedat: (item as Record<string, unknown>).updatedat || now,
            });

            // Filter to only columns that exist in the schema
            const record = await this.filterToSchemaColumns(rawRecord);

            const columns = Object.keys(record);
            const placeholders = columns.map(() => "?").join(", ");
            const values = columns.map((col) => record[col]) as SQLiteBindValue[];

            await db.runAsync(
                `INSERT INTO ${this.tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
                values
            );

            results.push(this.mapFromRow(record) as TModel);
        }

        return results;
    }

    async updateMultiple(data: Updates<TTable>[], tenantId: string): Promise<void> {
    }

    async deleteMultiple(ids: string[], tenantId: string): Promise<void> {
        for (const id of ids) {
            await this.softDelete(id, tenantId);
        }
    }

    async restoreMultiple(ids: string[], tenantId: string): Promise<void> {
        for (const id of ids) {
            await this.restore(id, tenantId);
        }
    }

    /**
     * Get all record IDs (for duplicate detection during import)
     */
    async getAllIds(): Promise<string[]> {
        const db = await getSqliteDB();
        const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM ${this.tableName}`);
        return rows.map((row) => row.id);
    }
}
