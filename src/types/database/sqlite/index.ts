import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { TableNames } from "../TableNames";
import { ALL_CREATE_TABLES, CREATE_INDICES } from "./schema";
import { ALL_CREATE_VIEWS, ALL_DROP_VIEWS } from "./views";

const DATABASE_NAME = "budgeteer.db";
const MAX_OPEN_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let database: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initialize the SQLite database with all tables and views
 * Uses async APIs throughout
 */
export const initializeSqliteDBAsync = async (): Promise<SQLite.SQLiteDatabase> => {
    if (isInitialized && database) {
        return database;
    }

    // Prevent concurrent initialization — return the in-flight promise if one exists
    if (initPromise) {
        return initPromise;
    }

    initPromise = _initializeImpl().finally(() => {
        initPromise = null;
    });
    return initPromise;
};

const _initializeImpl = async (): Promise<SQLite.SQLiteDatabase> => {
    if (isInitialized && database) {
        return database;
    }

    console.log("Initializing SQLite database...");

    // Open database asynchronously — on web the OPFS file-handle pool
    // can be temporarily exhausted, yielding "cannot create file" /
    // error-code-14.  Retry a few times with OPFS cleanup + delay.
    database = await openWithRetry(DATABASE_NAME);

    // Enable foreign keys
    await database.execAsync("PRAGMA foreign_keys = ON;");

    // Create all tables
    for (const createStatement of ALL_CREATE_TABLES) {
        await database.execAsync(createStatement);
    }

    // Create indices
    for (const indexStatement of CREATE_INDICES) {
        await database.execAsync(indexStatement);
    }

    // Create views
    await createViewsAsync(database);

    isInitialized = true;
    console.log("SQLite database initialized successfully");

    return database;
};

/**
 * Create or recreate all views
 */
export const createViewsAsync = async (db?: SQLite.SQLiteDatabase): Promise<void> => {
    const sqliteDb = db || database;
    if (!sqliteDb) {
        throw new Error("Database not initialized");
    }

    // Drop existing views first (in case schema changed)
    for (const dropStatement of ALL_DROP_VIEWS) {
        await sqliteDb.execAsync(dropStatement);
    }

    // Create all views
    for (const createStatement of ALL_CREATE_VIEWS) {
        await sqliteDb.execAsync(createStatement);
    }
};

/**
 * Get the SQLite database instance
 * Initializes if not already done
 */
export const getSqliteDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!isInitialized || !database) {
        return await initializeSqliteDBAsync();
    }
    return database;
};

/**
 * Check if SQLite database is ready
 */
export const isSqliteDBReady = (): boolean => {
    return isInitialized && database !== null;
};

/**
 * Clear all data for a specific tenant only
 * Does NOT drop tables or views, preserves data from other tenants
 */
export const clearSqliteDataByTenant = async (tenantId: string): Promise<void> => {
    const db = await getSqliteDB();

    console.log(`Clearing SQLite data for tenant: ${tenantId}`);

    // Delete in reverse dependency order to respect foreign keys
    const tables = [
        TableNames.Recurrings,
        TableNames.Transactions,
        TableNames.Configurations,
        TableNames.TransactionCategories,
        TableNames.TransactionGroups,
        TableNames.Accounts,
        TableNames.AccountCategories,
    ];

    for (const table of tables) {
        await db.runAsync(`DELETE FROM ${table} WHERE tenantid = ?`, [tenantId]);
    }

    console.log(`SQLite data cleared for tenant: ${tenantId}`);
};

/**
 * Clear all SQLite data (all tenants) - use with caution
 */
export const clearAllSqliteData = async (): Promise<void> => {
    const db = await getSqliteDB();

    console.log("Clearing all SQLite data...");

    const tables = [
        TableNames.Recurrings,
        TableNames.Transactions,
        TableNames.Configurations,
        TableNames.TransactionCategories,
        TableNames.TransactionGroups,
        TableNames.Accounts,
        TableNames.AccountCategories,
    ];

    for (const table of tables) {
        await db.runAsync(`DELETE FROM ${table}`);
    }

    console.log("All SQLite data cleared");
};

/**
 * Close the database connection
 */
export const closeSqliteDB = async (): Promise<void> => {
    if (database) {
        await database.closeAsync();
        database = null;
        isInitialized = false;
    }
};

/**
 * Try to clear stale OPFS file handles.
 * The AccessHandlePoolVFS allocates a fixed pool of OPFS files; leftover
 * journal/WAL files from crashed sessions can permanently fill the pool.
 * Removing them gives the next open attempt a clean slate.
 */
const clearOpfsFiles = async (): Promise<void> => {
    try {
        if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
            return;
        }
        const root = await navigator.storage.getDirectory();
        // Iterate over all entries and remove any that look like
        // wa-sqlite pool files (they are numbered .NNN files)
        for await (const [name] of (root as any).entries()) {
            // Remove journal/WAL files AND the numbered pool files that
            // AccessHandlePoolVFS pre-allocates (e.g. "0", "1", …).
            // Keeping the main db file is fine — SQLite will recreate
            // anything missing when it next opens successfully.
            const isPoolFile = /^\d+$/.test(name);
            const isAuxFile =
                name.startsWith(".") ||
                name.includes("-journal") ||
                name.includes("-wal") ||
                name.includes("-shm");
            if (isPoolFile || isAuxFile) {
                try {
                    await root.removeEntry(name);
                    console.log(`[SQLite] Removed stale OPFS entry: ${name}`);
                } catch {
                    // Ignore — entry might be locked
                }
            }
        }
    } catch (e) {
        console.warn("[SQLite] OPFS cleanup skipped:", e);
    }
};

/**
 * Open the database with retry logic for the web platform.
 * On web, expo-sqlite uses wa-sqlite with OPFS which has a limited
 * file-handle pool (AccessHandlePoolVFS, default capacity 6).
 * When the pool is temporarily exhausted we get "cannot create file" /
 * SQLITE_CANTOPEN (error code 14).  Between retries we attempt to clean
 * up stale OPFS entries and wait for the browser to reclaim handles.
 */
const openWithRetry = async (
    name: string,
    retries = MAX_OPEN_RETRIES,
): Promise<SQLite.SQLiteDatabase> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await SQLite.openDatabaseAsync(name);
        } catch (error) {
            const isWeb = Platform.OS === "web";
            const isLastAttempt = attempt === retries;

            if (!isWeb || isLastAttempt) {
                throw error;
            }

            console.warn(
                `[SQLite] openDatabaseAsync failed (attempt ${attempt}/${retries}), ` +
                `cleaning OPFS and retrying in ${RETRY_DELAY_MS * attempt}ms…`,
                error,
            );

            // Attempt to free stale OPFS handles before retrying
            await clearOpfsFiles();
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
    }
    // Unreachable, but satisfies TS
    throw new Error("Failed to open database after retries");
};

/**
 * Reset the database state (for testing or complete reset)
 */
export const resetSqliteDBConnection = (): void => {
    database = null;
    isInitialized = false;
    initPromise = null;
};

export default {
    initialize: initializeSqliteDBAsync,
    getDB: getSqliteDB,
    isReady: isSqliteDBReady,
    clearByTenant: clearSqliteDataByTenant,
    clearAll: clearAllSqliteData,
    close: closeSqliteDB,
    createViews: createViewsAsync,
};
