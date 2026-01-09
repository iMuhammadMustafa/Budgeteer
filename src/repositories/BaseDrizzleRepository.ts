import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { DatabaseContext, DrizzleSqliteDb, SupabaseDb } from "@/src/types/database/drizzle";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";
import { StorageMode } from "@/src/types/StorageMode";
import GenerateUuid from "@/src/utils/uuid.Helper";
import dayjs from "dayjs";
import { and, eq, gte, lte, SQL } from "drizzle-orm";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { IRepository } from "./interfaces/IRepository";

type AnyDrizzleTable = SQLiteTableWithColumns<any>;

export abstract class BaseDrizzleRepository<
    TTable extends AnyDrizzleTable,
    TTableName extends TableNames,
    TModel,
> implements IRepository<TModel, TTableName> {
    protected abstract table: TTable;
    protected abstract tableName: string;
    protected dbContext: DatabaseContext;

    constructor(dbContext: DatabaseContext) {
        this.dbContext = dbContext;
    }

    protected isCloudMode(): boolean {
        return this.dbContext.mode === StorageMode.Cloud;
    }

    protected getSqliteDb(): DrizzleSqliteDb {
        if (!this.dbContext.sqlite) {
            throw new Error("SQLite not available in cloud mode");
        }
        return this.dbContext.sqlite;
    }

    protected getSupabase(): SupabaseDb {
        if (!this.dbContext.supabase) {
            throw new Error("Supabase not available in local mode");
        }
        return this.dbContext.supabase;
    }

    protected getNow(): string {
        return dayjs().toISOString();
    }

    // =====================================
    // Read Operations
    // =====================================
    async findById(id: string, tenantId: string): Promise<TModel | null> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(this.tableName)
                .select()
                .eq("id", id)
                .eq("tenantid", tenantId)
                .eq("isdeleted", false)
                .single();

            if (error) throw error;
            return data as TModel;
        }

        const results = await this.getSqliteDb()
            .select()
            .from(this.table)
            .where(
                and(
                    eq((this.table as any).id, id),
                    eq((this.table as any).tenantid, tenantId),
                    eq((this.table as any).isdeleted, false)
                )
            )
            .limit(1);

        return (results[0] as TModel) ?? null;
    }

    async findAll(tenantId: string, filters: QueryFilters = {}): Promise<TModel[]> {
        if (this.isCloudMode()) {
            let query = this.getSupabase()
                .from(this.tableName)
                .select()
                .eq("tenantid", tenantId);

            if (filters.isDeleted === undefined) {
                query = query.eq("isdeleted", false);
            } else if (filters.isDeleted === true) {
                query = query.eq("isdeleted", true);
            }
            if (filters.startDate) {
                query = query.gte("createdat", filters.startDate);
            }

            if (filters.endDate) {
                query = query.lte("createdat", filters.endDate);
            }
            if (filters.offset && filters.limit) {
                query = query.range(filters.offset, filters.offset + filters.limit - 1);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as TModel[];
        }

        const conditions: SQL[] = [eq((this.table as any).tenantid, tenantId)];

        if (filters.isDeleted === undefined) {
            conditions.push(eq((this.table as any).isdeleted, false));
        } else if (filters.isDeleted === true) {
            conditions.push(eq((this.table as any).isdeleted, true));
        }
        if (filters.startDate) {
            conditions.push(gte((this.table as any).createdat, filters.startDate));
        }
        if (filters.endDate) {
            conditions.push(lte((this.table as any).createdat, filters.endDate));
        }
        let query = this.getSqliteDb()
            .select()
            .from(this.table)
            .where(and(...conditions));

        if (filters.offset !== undefined && filters.limit !== undefined) {
            query = query.limit(filters.limit).offset(filters.offset) as typeof query;
        }

        const results = await query;

        return results as TModel[];
    }

    async getAllIds(): Promise<string[]> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(this.tableName)
                .select("id");

            if (error) throw error;
            return (data ?? []).map((r: any) => r.id);
        }

        const results = await this.getSqliteDb()
            .select({ id: (this.table as any).id })
            .from(this.table);

        return results.map((r: any) => r.id);
    }

    // =====================================
    // Write Operations
    // =====================================

    async create(data: Inserts<TTableName>, tenantId: string): Promise<TModel> {
        const now = this.getNow();
        const id = data.id || GenerateUuid();

        const insertData = {
            ...data,
            id,
            tenantid: tenantId,
            isdeleted: false,
            createdat: now,
            updatedat: now,
        };

        if (this.isCloudMode()) {
            const { data: result, error } = await this.getSupabase()
                .from(this.tableName)
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;
            return result as TModel;
        }

        const db = this.getSqliteDb();
        await (db as any).insert(this.table).values(insertData);

        const result = await this.findById(id, tenantId);
        if (!result) throw new Error("Failed to create record");
        return result;
    }

    async update(
        id: string,
        data: Updates<TTableName>,
        tenantId: string
    ): Promise<TModel | null> {
        const now = this.getNow();
        const updateData = {
            ...data,
            updatedat: now,
        };

        delete (updateData as any).id;
        delete (updateData as any).createdat;
        delete (updateData as any).createdby;
        delete (updateData as any).tenantid;

        if (this.isCloudMode()) {
            const { data: result, error } = await this.getSupabase()
                .from(this.tableName)
                .update(updateData)
                .eq("id", id)
                .eq("tenantid", tenantId)
                .select()
                .single();

            if (error) {
                if (error.code === "PGRST116") return null;
                throw error;
            }
            return result as TModel;
        }

        const db = this.getSqliteDb();
        await (db as any)
            .update(this.table)
            .set(updateData)
            .where(
                and(
                    eq((this.table as any).id, id),
                    eq((this.table as any).tenantid, tenantId),
                    eq((this.table as any).isdeleted, false)
                )
            );

        return this.findById(id, tenantId);
    }

    async delete(id: string, tenantId: string): Promise<void> {
        return this.softDelete(id, tenantId);
    }

    async hardDelete(id: string, tenantId: string): Promise<void> {
        if (this.isCloudMode()) {
            const { error } = await this.getSupabase()
                .from(this.tableName)
                .delete()
                .eq("id", id)
                .eq("tenantid", tenantId);

            if (error) throw error;
            return;
        }

        const db = this.getSqliteDb();
        await (db as any)
            .delete(this.table)
            .where(
                and(
                    eq(this.table.id, id),
                    eq(this.table.tenantid, tenantId)
                )
            );
    }

    async softDelete(id: string, tenantId: string): Promise<void> {
        const now = this.getNow();

        if (this.isCloudMode()) {
            const { error } = await this.getSupabase()
                .from(this.tableName)
                .update({ isdeleted: true, updatedat: now })
                .eq("id", id)
                .eq("tenantid", tenantId);

            if (error) throw error;
            return;
        }

        const db = this.getSqliteDb();
        await (db as any)
            .update(this.table)
            .set({ isdeleted: true, updatedat: now })
            .where(
                and(
                    eq(this.table.id, id),
                    eq(this.table.tenantid, tenantId),
                    eq(this.table.isdeleted, false)
                )
            );
    }

    async restore(id: string, tenantId: string): Promise<void> {
        const now = this.getNow();

        if (this.isCloudMode()) {
            const { error } = await this.getSupabase()
                .from(this.tableName)
                .update({ isdeleted: false, updatedat: now })
                .eq("id", id)
                .eq("tenantid", tenantId)
                .eq("isdeleted", true);

            if (error) throw error;
            return;
        }

        const db = this.getSqliteDb();
        await (db as any)
            .update(this.table)
            .set({ isdeleted: false, updatedat: now })
            .where(
                and(
                    eq(this.table.id, id),
                    eq(this.table.tenantid, tenantId),
                    eq(this.table.isdeleted, true)
                )
            );
    }

    // =====================================
    // Batch Operations
    // =====================================

    async updateMultiple(
        data: Updates<TTableName>[],
        tenantId: string
    ): Promise<void> {
        for (const item of data) {
            if (item.id) {
                await this.update(item.id, item, tenantId);
            }
        }
    }
    async deleteMultiple(ids: string[], tenantId: string): Promise<void> {
        for (const id of ids) {
            await this.delete(id, tenantId);
        }
    }
    async softDeleteMultiple(ids: string[], tenantId: string): Promise<void> {
        for (const id of ids) {
            await this.softDelete(id, tenantId);
        }
    }
    async restoreMultiple(ids: string[], tenantId: string): Promise<void> {
        for (const id of ids) {
            await this.restore(id, tenantId);
        }
    }
}
