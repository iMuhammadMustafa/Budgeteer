/**
 * Node-backed SQLite adapter for integration tests.
 *
 * Wraps Node's built-in `node:sqlite` (Node ≥ 22.5) to expose the exact async
 * surface that `BaseSqliteRepository` and the concrete SQLite repos consume from
 * `expo-sqlite`'s `SQLiteDatabase`:
 *   getAllAsync, getFirstAsync, runAsync, execAsync, withTransactionAsync,
 *   closeAsync, plus `PRAGMA table_info(...)` via getAllAsync.
 *
 * A fresh `:memory:` database per call gives every test perfect isolation with
 * zero cleanup. Schema (tables + indices + views) is applied from the real
 * `schema.ts` / `views.ts` so tests exercise production DDL.
 *
 * Usage (see nodeSqliteAdapter.test.ts and the repo tests for the mock pattern):
 *
 *   const h = vi.hoisted(() => ({ db: null as any }));
 *   vi.mock("@/src/types/database/sqlite", () => ({
 *     getSqliteDB: async () => h.db,
 *     createViewsAsync: async () => {},
 *     resetSqliteDBConnection: () => {},
 *   }));
 *   beforeEach(() => { h.db = createNodeSqliteDb(); });
 *   afterEach(() => h.db.closeAsync());
 */
import { DatabaseSync } from "node:sqlite";
import { ALL_CREATE_TABLES, CREATE_INDICES } from "@/src/types/database/sqlite/schema";
import { ALL_CREATE_VIEWS } from "@/src/types/database/sqlite/views";

/** A supported SQLite bind value once normalized for node:sqlite. */
type BindValue = string | number | bigint | null | Uint8Array;

/** The subset of expo-sqlite's SQLiteDatabase surface the app actually uses. */
export interface ExpoLikeSqliteDb {
    getAllAsync<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
    getFirstAsync<T = any>(sql: string, params?: unknown[]): Promise<T | null>;
    runAsync(
        sql: string,
        params?: unknown[],
    ): Promise<{ changes: number; lastInsertRowId: number }>;
    execAsync(sql: string): Promise<void>;
    withTransactionAsync(task: () => Promise<void>): Promise<void>;
    closeAsync(): Promise<void>;
    /** Escape hatch to the underlying node:sqlite handle for assertions. */
    readonly __raw: DatabaseSync;
}

/**
 * node:sqlite only accepts null | number | bigint | string | Uint8Array as bind
 * values. expo-sqlite is more permissive (booleans, undefined). The base repo
 * already maps booleans → 0/1 via mapToRow, but raw queries and edge cases can
 * still pass booleans/undefined, so normalize defensively to match expo behavior.
 */
function normalizeParam(value: unknown): BindValue {
    if (value === undefined || value === null) return null;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "bigint" ||
        value instanceof Uint8Array
    ) {
        return value;
    }
    // Objects/arrays are not valid SQLite scalars — stringify to fail loudly in a
    // way that mirrors how a malformed bind would surface, rather than crash the
    // native binding with an opaque error.
    return JSON.stringify(value);
}

function normalizeParams(params?: unknown[]): BindValue[] {
    if (!params || params.length === 0) return [];
    return params.map(normalizeParam);
}

/**
 * Create a fresh in-memory SQLite database exposing the expo-sqlite async
 * surface. By default it applies the full app schema (tables, indices, views)
 * and enables foreign keys — matching `initializeSqliteDBAsync`.
 *
 * @param opts.applySchema  create tables/indices/views (default true)
 * @param opts.foreignKeys  enable `PRAGMA foreign_keys` (default true)
 */
export function createNodeSqliteDb(
    opts: { applySchema?: boolean; foreignKeys?: boolean } = {},
): ExpoLikeSqliteDb {
    const { applySchema = true, foreignKeys = true } = opts;
    // node:sqlite enables FK constraints by default; drive it from the option so
    // callers can opt out (e.g. base-repo mapping tests that use synthetic refs).
    const raw = new DatabaseSync(":memory:", { enableForeignKeyConstraints: foreignKeys });

    if (applySchema) {
        for (const stmt of ALL_CREATE_TABLES) raw.exec(stmt);
        for (const stmt of CREATE_INDICES) raw.exec(stmt);
        for (const stmt of ALL_CREATE_VIEWS) raw.exec(stmt);
    }

    const adapter: ExpoLikeSqliteDb = {
        async getAllAsync<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
            const stmt = raw.prepare(sql);
            return stmt.all(...normalizeParams(params)) as T[];
        },
        async getFirstAsync<T = any>(sql: string, params?: unknown[]): Promise<T | null> {
            const stmt = raw.prepare(sql);
            const row = stmt.get(...normalizeParams(params));
            return (row as T) ?? null;
        },
        async runAsync(sql: string, params?: unknown[]) {
            const stmt = raw.prepare(sql);
            const res = stmt.run(...normalizeParams(params));
            return {
                changes: Number(res.changes),
                lastInsertRowId: Number(res.lastInsertRowid),
            };
        },
        async execAsync(sql: string): Promise<void> {
            raw.exec(sql);
        },
        async withTransactionAsync(task: () => Promise<void>): Promise<void> {
            raw.exec("BEGIN");
            try {
                await task();
                raw.exec("COMMIT");
            } catch (err) {
                raw.exec("ROLLBACK");
                throw err;
            }
        },
        async closeAsync(): Promise<void> {
            raw.close();
        },
        __raw: raw,
    };

    return adapter;
}
