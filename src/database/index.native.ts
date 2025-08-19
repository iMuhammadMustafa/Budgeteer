import { Platform } from "react-native";
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

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
    console.log("Initializing WatermelonDB database for React Native...");

    // React Native setup using SQLite
    const adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: databaseName,
      jsi: Platform.OS === "ios", // Enable JSI on iOS for better performance
      onSetUpError: (error: any) => {
        console.error("Database failed to load:", error);
        // Database failed to load -- offer the user to reload the app or log out
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
    console.log("WatermelonDB database initialized successfully for React Native");
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

// Default export for convenience
const watermelonDB = {
  initialize: initializeWatermelonDB,
  getDB: getWatermelonDB,
  isReady: isWatermelonDBReady,
  reset: resetWatermelonDB,
};

export default watermelonDB;
