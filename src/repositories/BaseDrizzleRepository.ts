/**
 * Base Drizzle Repository
 * 
 * Unified base repository that works with both:
 * - SQLite (Local/Demo mode via Expo SQLite + Drizzle)
 * - PostgreSQL (Cloud mode via Supabase)
 * 
 * Implements the IRepository interface for consistent data access.
 */

import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { DrizzleLocalDb, getLocalDb } from "@/src/types/database/drizzle";
import { getCloudClient } from "@/src/types/database/drizzle/supabase";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Updates } from "@/src/types/database/Tables.Types";
import { StorageMode } from "@/src/types/StorageMode";
import GenerateUuid from "@/src/utils/uuid.Helper";
import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { IRepository } from "./interfaces/IRepository";

// Simplified table type - any SQLite table with standard columns
type AnyDrizzleTable = SQLiteTableWithColumns<any>;

export abstract class BaseDrizzleRepository<
    TTable extends AnyDrizzleTable,
    TTableName extends TableNames,
    TModel,
> implements IRepository<TModel, TTableName> {
    protected abstract table: TTable;
    protected abstract tableName: string;
    protected storageMode: StorageMode;

    constructor(storageMode: StorageMode) {
        this.storageMode = storageMode;
    }

    // =====================================
    // Internal Helpers
    // =====================================

    protected getDb(): DrizzleLocalDb {
        return getLocalDb();
    }

    protected getSupabase() {
        return getCloudClient();
    }

    protected isCloudMode(): boolean {
        return this.storageMode === StorageMode.Cloud;
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

            if (error) {
                if (error.code === "PGRST116") return null;
                throw error;
            }
            return data as TModel;
        }

        const db = this.getDb();
        const results = await db
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

            // Handle isDeleted filter
            if (filters.isDeleted === undefined) {
                query = query.eq("isdeleted", false);
            } else if (filters.isDeleted === true) {
                query = query.eq("isdeleted", true);
            }
            // isDeleted === false means show all

            const { data, error } = await query;
            if (error) throw error;
            return data as TModel[];
        }

        const db = this.getDb();
        const conditions: any[] = [eq((this.table as any).tenantid, tenantId)];

        // Handle isDeleted filter
        if (filters.isDeleted === undefined) {
            conditions.push(eq((this.table as any).isdeleted, false));
        } else if (filters.isDeleted === true) {
            conditions.push(eq((this.table as any).isdeleted, true));
        }

        const results = await db
            .select()
            .from(this.table)
            .where(and(...conditions));

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

        const db = this.getDb();
        const results = await db.select({ id: (this.table as any).id }).from(this.table);
        return results.map((r) => r.id);
    }

    // =====================================
    // Write Operations
    // =====================================

    async create(data: Inserts<TTableName>, tenantId: string): Promise<TModel> {
        const now = this.getNow();
        const id = (data as any).id || GenerateUuid();

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

        const db = this.getDb();
        await db.insert(this.table).values(insertData as any);

        // Fetch and return the created record
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

        // Remove fields that shouldn't be updated
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

        const db = this.getDb();
        await db
            .update(this.table)
            .set(updateData as any)
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

        const db = this.getDb();
        await db
            .delete(this.table)
            .where(
                and(eq((this.table as any).id, id), eq((this.table as any).tenantid, tenantId))
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

        const db = this.getDb();
        await db
            .update(this.table)
            .set({ isdeleted: true, updatedat: now } as any)
            .where(
                and(
                    eq((this.table as any).id, id),
                    eq((this.table as any).tenantid, tenantId),
                    eq((this.table as any).isdeleted, false)
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

        const db = this.getDb();
        await db
            .update(this.table)
            .set({ isdeleted: false, updatedat: now } as any)
            .where(
                and(
                    eq((this.table as any).id, id),
                    eq((this.table as any).tenantid, tenantId),
                    eq((this.table as any).isdeleted, true)
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
            if ((item as any).id) {
                await this.update((item as any).id, item, tenantId);
            }
        }
    }
}
