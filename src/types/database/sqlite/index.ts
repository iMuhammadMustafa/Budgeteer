import * as SQLite from "expo-sqlite";
import { TableNames } from "../TableNames";
import { ALL_CREATE_TABLES, CREATE_INDICES } from "./schema";
import { ALL_CREATE_VIEWS, ALL_DROP_VIEWS } from "./views";

const DATABASE_NAME = "budgeteer.db";

let database: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

/**
 * Initialize the SQLite database with all tables and views
 * Uses async APIs throughout
 */
export const initializeSqliteDBAsync = async (): Promise<SQLite.SQLiteDatabase> => {
    if (isInitialized && database) {
        return database;
    }

    console.log("Initializing SQLite database...");

    // Open database asynchronously
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);

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
 * Reset the database state (for testing or complete reset)
 */
export const resetSqliteDBConnection = (): void => {
    database = null;
    isInitialized = false;
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
