import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { openDatabaseAsync, openDatabaseSync, SQLiteDatabase } from "expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as schema from "../types/db/sqllite/schema";
import migrations from "../types/db/sqllite/drizzle/migrations";

// Global state variables
let db: ExpoSQLiteDatabase<typeof schema> | null = null;
let rawDb: SQLiteDatabase | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Private function to handle the actual initialization
const doInitialize = async (databaseName: string): Promise<void> => {
  try {
    console.log("Initializing SQLite database...");

    // Try async first, fallback to sync if needed
    let expoDb;
    try {
      expoDb = await openDatabaseAsync(databaseName, { enableChangeListener: true });
      console.log("Database opened with async method");
    } catch (asyncError) {
      console.log("Async method failed, trying sync method:", asyncError);
      expoDb = openDatabaseSync(databaseName, { enableChangeListener: true });
      console.log("Database opened with sync method");
    }

    // Store the raw database for drizzle-studio-expo
    rawDb = expoDb;

    // Create Drizzle instance
    db = drizzle(expoDb, { schema });
    console.log("Drizzle instance created");

    try {
      await runMigrations();
    } catch (migrationError) {
      console.warn("Auto-migration failed, but database is still available:", migrationError);
    }

    isInitialized = true;
    console.log("SQLite database initialized successfully");
  } catch (err) {
    console.error("Failed to initialize SQLite database:", err);
    throw new Error(err instanceof Error ? err.message : "Unknown database error");
  }
};

// Private function to handle migrations
const runMigrations = async (): Promise<void> => {
  if (!db) {
    throw new Error("Database not initialized before running migrations");
  }

  try {
    console.log("Running SQLite migrations...");
    await migrate(db, migrations);
    console.log("SQLite migrations completed successfully");
  } catch (migrationError) {
    console.error("Migration failed:", migrationError);
    throw new Error(
      `Migration failed: ${migrationError instanceof Error ? migrationError.message : "Unknown migration error"}`,
    );
  }
};

// Public function to initialize the database
export const initializeSQLite = async (databaseName: string = "budgeteerdb"): Promise<void> => {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = doInitialize(databaseName);
  return initializationPromise;
};

// Public function to get the database instance
export const getSQLiteDB = async (): Promise<ExpoSQLiteDatabase<typeof schema> | null> => {
  if (!isInitialized || !db) {
    try {
      await initializeSQLite();
    } catch (error) {
      console.error("Failed to auto-initialize database:", error);
      return null;
    }
  }
  return db;
};

// Public function to get the raw database instance (for drizzle-studio-expo)
export const getRawSQLiteDB = (): SQLiteDatabase | null => {
  if (!isInitialized || !rawDb) {
    return null;
  }
  return rawDb;
};

// Public function to check if database is ready
export const isSQLiteReady = (): boolean => {
  return isInitialized && db !== null;
};

// Function to reset the database (useful for testing or reinitializing)
export const resetSQLite = (): void => {
  db = null;
  rawDb = null;
  isInitialized = false;
  initializationPromise = null;
};

// Default export for convenience (returns the database instance)
const sqlite = {
  initialize: initializeSQLite,
  getDB: getSQLiteDB,
  getRawDB: getRawSQLiteDB,
  isReady: isSQLiteReady,
  reset: resetSQLite,
};

export default sqlite;
