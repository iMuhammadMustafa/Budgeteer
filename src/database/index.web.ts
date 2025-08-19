import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";

import { schema } from "./schema";
import migrations from "./migrations";
import {
  AccountCategory,
  Account,
  TransactionGroup,
  TransactionCategory,
  Transaction,
  Configuration,
  Recurring,
  Profile,
} from "./models";

// Global state variables
let database: Database | null = null;
let isInitialized = false;
let initializationPromise: Promise<Database> | null = null;

// Private function to handle the actual initialization
const doInitialize = async (databaseName: string = "budgeteerdb"): Promise<Database> => {
  try {
    console.log("Initializing WatermelonDB database for Web...");

    // Web setup using LokiJS
    const adapter = new LokiJSAdapter({
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      dbName: databaseName,
      onQuotaExceededError: (error: any) => {
        console.error("Browser ran out of disk space:", error);
        // Browser ran out of disk space -- offer the user to reload the app or log out
      },
      onSetUpError: (error: any) => {
        console.error("Database failed to load:", error);
        // Database failed to load -- offer the user to reload the app or log out
      },
      extraIncrementalIDBOptions: {
        onDidOverwrite: () => {
          console.warn("IndexedDB was overwritten by another tab");
          // Called when this adapter is forced to overwrite contents of IndexedDB.
          // This happens if there's another open tab of the same app that's making changes.
          // Try to synchronize the app now, and if user is offline, alert them that if they close this
          // tab, some data may be lost
        },
        onversionchange: () => {
          console.warn("Database was deleted in another tab");
          // database was deleted in another browser tab (user logged out), so we must make sure we delete
          // it in this tab as well - usually best to just refresh the page
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        },
      },
    });

    // Create the database
    database = new Database({
      adapter,
      modelClasses: [
        AccountCategory,
        Account,
        TransactionGroup,
        TransactionCategory,
        Transaction,
        Configuration,
        Recurring,
        Profile,
      ],
    });

    isInitialized = true;
    console.log("WatermelonDB database initialized successfully for Web");
    return database;
  } catch (err) {
    console.error("Failed to initialize WatermelonDB database:", err);
    throw new Error(err instanceof Error ? err.message : "Unknown database error");
  }
};

// Public function to initialize the database
export const initializeWatermelonDB = async (databaseName?: string): Promise<Database> => {
  if (isInitialized && database) {
    return database;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = doInitialize(databaseName);
  const db = await initializationPromise;
  return db;
};

// Public function to get the database instance
export const getWatermelonDB = async (): Promise<Database> => {
  if (!isInitialized || !database) {
    try {
      return await initializeWatermelonDB();
    } catch (error) {
      console.error("Failed to auto-initialize database:", error);
      throw error;
    }
  }
  return database;
};

// Public function to check if database is ready
export const isWatermelonDBReady = (): boolean => {
  return isInitialized && database !== null;
};

// Function to reset the database (useful for testing or reinitializing)
export const resetWatermelonDB = (): void => {
  database = null;
  isInitialized = false;
  initializationPromise = null;
};

// Function to clear the database completely (for web, clears IndexedDB)
export const clearWatermelonDB = async (databaseName: string = "budgeteerdb"): Promise<void> => {
  try {
    resetWatermelonDB();
    // For web, clear IndexedDB
    if (typeof window !== "undefined" && window.indexedDB) {
      const deleteReq = window.indexedDB.deleteDatabase(databaseName);
      await new Promise((resolve, reject) => {
        deleteReq.onsuccess = () => {
          console.log("IndexedDB database cleared successfully");
          resolve(undefined);
        };
        deleteReq.onerror = () => reject(deleteReq.error);
      });
    }
  } catch (error) {
    console.warn("Could not clear database:", error);
    // If we can't delete the database, just reset the references
    resetWatermelonDB();
  }
};

// Default export for convenience
const watermelonDB = {
  initialize: initializeWatermelonDB,
  getDB: getWatermelonDB,
  isReady: isWatermelonDBReady,
  reset: resetWatermelonDB,
  clear: clearWatermelonDB,
};

export default watermelonDB;
