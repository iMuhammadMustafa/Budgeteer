import { Database } from "@nozbe/watermelondb";
import { Platform } from "react-native";

import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "./migrations";
import {
  Account,
  AccountCategory,
  Configuration,
  Profile,
  Recurring,
  Transaction,
  TransactionCategory,
  TransactionGroup,
} from "./models";

import { schema } from "./schema";

let database: Database | null = null;
let isInitialized = false;

export const initializeWatermelonDB = async (databaseName?: string): Promise<Database> => {
  if (isInitialized && database) {
    return database;
  }

  return await doInitialize(databaseName);
};

export const getWatermelonDB = async (): Promise<Database> => {
  if (!isInitialized || !database) {
    return await initializeWatermelonDB();
  }
  return database;
};
export const isWatermelonDBReady = (): boolean => {
  return isInitialized && database !== null;
};

export const clearWatermelonDB = async (databaseName: string = "budgeteerdb"): Promise<void> => {
  resetWatermelonDBConnection();

  if (Platform.OS === "web") {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn("Database deletion blocked. Please close other tabs with this app open.");
      };
    });
  }
};

const resetWatermelonDBConnection = (): void => {
  database = null;
  isInitialized = false;
};
const doInitialize = async (databaseName: string = "budgeteerdb"): Promise<Database> => {
  let adapter: any;

  if (Platform.OS === "web") {
    adapter = buildLokiJSAdapter(databaseName);
  } else {
    adapter = new SQLiteAdapter({
      schema,
      migrations,
      dbName: databaseName,
      jsi: Platform.OS === "ios", // Enable JSI on iOS for better performance
      onSetUpError: (error: any) => {
        console.error("Database failed to load:", error);
      },
    });
  }
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
  return database;
};

const buildLokiJSAdapter = (databaseName: string) => {
  return new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    dbName: databaseName,
    onQuotaExceededError: (error: any) => {
      console.error("Browser ran out of disk space:", error);
    },
    onSetUpError: (error: any) => {
      console.error("Database failed to load:", error);
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
};

export default {
  initialize: initializeWatermelonDB,
  getDB: getWatermelonDB,
  isReady: isWatermelonDBReady,
  clear: clearWatermelonDB,
};
