import supabase from "@/src/providers/Supabase";
import { StorageMode } from "@/src/types/StorageMode";
import { drizzle as drizzleSqlite } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import * as sqliteSchema from "./schema";
import { CREATE_ALL_VIEWS_SQL, DROP_ALL_VIEWS_SQL } from "./views";

// =====================================
// Types
// =====================================

// For local mode: Drizzle SQLite instance
export type DrizzleSqliteDb = ReturnType<typeof drizzleSqlite>;

// For cloud mode: Supabase client (not Drizzle - postgres.js doesn't work in RN)
export type SupabaseDb = typeof supabase;

export type DatabaseContext = {
  mode: StorageMode;
  sqlite?: DrizzleSqliteDb;
  supabase?: SupabaseDb;
};

// =====================================
// SQLite Database (Local/Demo Mode)
// =====================================

let sqliteDb: DrizzleSqliteDb | null = null;
let sqliteRawDb: SQLiteDatabase | null = null;
let sqliteInitialized = false;
let sqliteInitPromise: Promise<void> | null = null;

const DATABASE_NAME = "budgeteer.db";

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS accountcategories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Asset',
    displayorder INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'Ellipsis',
    color TEXT NOT NULL DEFAULT 'warning-100',
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    owner TEXT,
    description TEXT,
    notes TEXT,
    icon TEXT NOT NULL DEFAULT 'Ellipsis',
    color TEXT NOT NULL DEFAULT 'warning-100',
    displayorder INTEGER NOT NULL DEFAULT 0,
    statementdate INTEGER,
    categoryid TEXT NOT NULL,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS transactiongroups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'Expense',
    budgetamount REAL NOT NULL DEFAULT 0,
    budgetfrequency TEXT NOT NULL DEFAULT 'Monthly',
    icon TEXT NOT NULL DEFAULT 'Ellipsis',
    color TEXT NOT NULL DEFAULT 'warning-100',
    displayorder INTEGER NOT NULL DEFAULT 0,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS transactioncategories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'Expense',
    budgetamount REAL NOT NULL DEFAULT 0,
    budgetfrequency TEXT NOT NULL DEFAULT 'Monthly',
    icon TEXT NOT NULL DEFAULT 'Ellipsis',
    color TEXT NOT NULL DEFAULT 'warning-100',
    displayorder INTEGER NOT NULL DEFAULT 0,
    groupid TEXT NOT NULL,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT,
    date TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'Expense',
    payee TEXT,
    description TEXT,
    notes TEXT,
    tags TEXT,
    isvoid INTEGER NOT NULL DEFAULT 0,
    categoryid TEXT NOT NULL,
    accountid TEXT NOT NULL,
    transferid TEXT,
    transferaccountid TEXT,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS configurations (
    id TEXT PRIMARY KEY NOT NULL,
    tablename TEXT NOT NULL,
    type TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    tenantid TEXT,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS recurrings (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'Expense',
    recurringtype TEXT,
    amount REAL,
    currencycode TEXT NOT NULL DEFAULT 'USD',
    recurrencerule TEXT NOT NULL,
    nextoccurrencedate TEXT,
    enddate TEXT,
    intervalmonths INTEGER,
    isactive INTEGER NOT NULL DEFAULT 1,
    isamountflexible INTEGER NOT NULL DEFAULT 0,
    isdateflexible INTEGER NOT NULL DEFAULT 0,
    autoapplyenabled INTEGER,
    lastexecutedat TEXT,
    lastautoappliedat TEXT,
    failedattempts INTEGER,
    maxfailedattempts INTEGER,
    payeename TEXT,
    notes TEXT,
    sourceaccountid TEXT NOT NULL,
    categoryid TEXT NOT NULL,
    transferaccountid TEXT,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT DEFAULT (datetime('now')),
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  );
  
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT,
    tenantid TEXT,
    updated_at TEXT
  );
`;

const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_accountcategories_tenantid ON accountcategories(tenantid);
  CREATE INDEX IF NOT EXISTS idx_accounts_tenantid ON accounts(tenantid);
  CREATE INDEX IF NOT EXISTS idx_accounts_categoryid ON accounts(categoryid);
  CREATE INDEX IF NOT EXISTS idx_transactiongroups_tenantid ON transactiongroups(tenantid);
  CREATE INDEX IF NOT EXISTS idx_transactioncategories_tenantid ON transactioncategories(tenantid);
  CREATE INDEX IF NOT EXISTS idx_transactioncategories_groupid ON transactioncategories(groupid);
  CREATE INDEX IF NOT EXISTS idx_transactions_tenantid ON transactions(tenantid);
  CREATE INDEX IF NOT EXISTS idx_transactions_accountid ON transactions(accountid);
  CREATE INDEX IF NOT EXISTS idx_transactions_categoryid ON transactions(categoryid);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_recurrings_tenantid ON recurrings(tenantid);
`;

export const initializeSqliteDb = async (): Promise<DrizzleSqliteDb> => {
  if (sqliteInitialized && sqliteDb) {
    return sqliteDb;
  }

  if (sqliteInitPromise) {
    await sqliteInitPromise;
    return sqliteDb!;
  }

  sqliteInitPromise = (async () => {
    try {
      sqliteRawDb = await openDatabaseAsync(DATABASE_NAME);
      sqliteDb = drizzleSqlite(sqliteRawDb as any, { schema: sqliteSchema });
      await sqliteRawDb.execAsync(CREATE_TABLES_SQL);
      await sqliteRawDb.execAsync(CREATE_INDEXES_SQL);
      // Recreate views (drop first to ensure latest definitions)
      await sqliteRawDb.execAsync(DROP_ALL_VIEWS_SQL);
      await sqliteRawDb.execAsync(CREATE_ALL_VIEWS_SQL);
      sqliteInitialized = true;
    } catch (error) {
      console.error("Failed to initialize SQLite:", error);
      sqliteInitPromise = null;
      throw error;
    }
  })();

  await sqliteInitPromise;
  return sqliteDb!;
};

/**
 * Get SQLite database instance
 */
export const getSqliteDb = (): DrizzleSqliteDb => {
  if (!sqliteDb) {
    throw new Error("SQLite not initialized. Call initializeSqliteDb first.");
  }
  return sqliteDb;
};

/**
 * Get raw SQLite database for direct SQL
 */
export const getRawSqliteDb = (): SQLiteDatabase => {
  if (!sqliteRawDb) {
    throw new Error("SQLite not initialized.");
  }
  return sqliteRawDb;
};


export const isSqliteInitialized = (): boolean => sqliteInitialized;

export const clearSqliteDb = async (tenantId?: string): Promise<void> => {
  if (!sqliteRawDb) return;

  if (tenantId) {
    // Clear only the specified tenant's data
    const clearSQL = `
      DELETE FROM transactions WHERE tenantid = '${tenantId}';
      DELETE FROM recurrings WHERE tenantid = '${tenantId}';
      DELETE FROM configurations WHERE tenantid = '${tenantId}';
      DELETE FROM transactioncategories WHERE tenantid = '${tenantId}';
      DELETE FROM transactiongroups WHERE tenantid = '${tenantId}';
      DELETE FROM accounts WHERE tenantid = '${tenantId}';
      DELETE FROM accountcategories WHERE tenantid = '${tenantId}';
      DELETE FROM profiles WHERE tenantid = '${tenantId}';
    `;
    await sqliteRawDb.execAsync(clearSQL);
  } else {
    // Clear all data (backward compatibility)
    const clearSQL = `
      DELETE FROM transactions;
      DELETE FROM recurrings;
      DELETE FROM configurations;
      DELETE FROM transactioncategories;
      DELETE FROM transactiongroups;
      DELETE FROM accounts;
      DELETE FROM accountcategories;
      DELETE FROM profiles;
    `;
    await sqliteRawDb.execAsync(clearSQL);
  }
};

export const resetSqliteDb = async (): Promise<void> => {
  if (sqliteRawDb) {
    await sqliteRawDb.closeAsync();
  }
  sqliteDb = null;
  sqliteRawDb = null;
  sqliteInitialized = false;
  sqliteInitPromise = null;
};

// =====================================
// Supabase (Cloud Mode)
// =====================================

/**
 * Get Supabase client for cloud mode
 * Note: We use Supabase SDK instead of postgres.js because
 * postgres.js uses Node.js Buffer which isn't available in React Native
 */
export const getSupabaseClient = (): SupabaseDb => {
  return supabase;
};

// =====================================
// Unified Database Access
// =====================================

/**
 * Initialize database for the given storage mode
 */
export const initializeDatabase = async (storageMode: StorageMode): Promise<DatabaseContext> => {
  if (storageMode === StorageMode.Cloud) {
    return {
      mode: storageMode,
      supabase: getSupabaseClient(),
    };
  }

  // Local or Demo mode
  const sqlite = await initializeSqliteDb();
  return {
    mode: storageMode,
    sqlite,
  };
};

/**
 * Reset database connection for mode switching
 */
export const resetDatabase = async (storageMode: StorageMode): Promise<void> => {
  if (storageMode !== StorageMode.Cloud) {
    await resetSqliteDb();
  }
  // Supabase client doesn't need resetting
};

// =====================================
// Exports
// =====================================

export { sqliteSchema as schema };

