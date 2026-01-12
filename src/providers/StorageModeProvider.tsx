import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import {
  clearSqliteDb,
  DatabaseContext,
  getSupabaseClient,
  initializeSqliteDb,
} from "@/src/types/database/drizzle";
import { DEMO_TENANT_ID } from "@/src/types/database/drizzle/constants";
import { seedDemoDb, seedLocalDb } from "@/src/types/database/drizzle/seed";
import { StorageMode } from "@/src/types/StorageMode";
import { storage } from "@/src/utils/storageUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type StorageModeContextType = {
  isLoading: boolean;
  storageMode: StorageMode | null;
  setStorageMode: (mode: StorageMode | null) => Promise<void>;
  dbContext: IRepositoryFactory | null;
};

export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  STORAGE_MODE: "budgeteer-storage-mode",
  DB_SEEDED: "budgeteer-db-seeded",
  DEMO_SEEDED: "budgeteer-demo-seeded",
} as const;

const storageModeContext = createContext<StorageModeContextType | undefined>({
  isLoading: false,
  storageMode: null,
  setStorageMode: async () => { },
  dbContext: null,
});

export default function StorageModeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const [dbContextState, setDbContextState] = useState<DatabaseContext | null>(null);

  const dbContext = useMemo(
    () => (dbContextState ? createRepositoryFactory(dbContextState) : null),
    [dbContextState]
  );

  useEffect(() => {
    const initialize = async () => {
      const mode = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);

      if (mode === StorageMode.Local || mode === StorageMode.Demo) {
        const sqlite = await initializeSqliteDb();
        setDbContextState({ mode, sqlite });
      } else if (mode === StorageMode.Cloud) {
        setDbContextState({ mode: StorageMode.Cloud, supabase: getSupabaseClient() });
      }

      setStorageMode(mode as StorageMode);
      setIsLoading(false);
    };
    initialize();
  }, []);

  const clearDemoData = useCallback(async () => {
    await clearSqliteDb(DEMO_TENANT_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.DEMO_SEEDED);
  }, []);

  const handleLogout = useCallback(async () => {
    if (storageMode === StorageMode.Demo) {
      await clearDemoData();
    }

    await AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);

    setDbContextState(null);
    setStorageMode(null);
  }, [storageMode, clearDemoData]);

  const initializeLocalMode = useCallback(async () => {
    const sqlite = await initializeSqliteDb();
    setDbContextState({ mode: StorageMode.Local, sqlite });

    const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.DB_SEEDED);
    if (!isSeeded) {
      await seedLocalDb();
      await AsyncStorage.setItem(STORAGE_KEYS.DB_SEEDED, "true");
    }
  }, []);

  const initializeDemoMode = useCallback(async () => {
    const sqlite = await initializeSqliteDb();
    setDbContextState({ mode: StorageMode.Demo, sqlite });

    const isSeeded = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_SEEDED);
    if (!isSeeded) {
      await clearSqliteDb(DEMO_TENANT_ID);
      await seedDemoDb();
      await AsyncStorage.setItem(STORAGE_KEYS.DEMO_SEEDED, "true");
    }
  }, []);

  const initializeCloudMode = useCallback(() => {
    setDbContextState({ mode: StorageMode.Cloud, supabase: getSupabaseClient() });
  }, []);

  const handleSetStorageMode = useCallback(
    async (mode: StorageMode | null) => {
      if (!mode) {
        await handleLogout();
        return;
      }

      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);

      switch (mode) {
        case StorageMode.Local:
          await initializeLocalMode();
          break;
        case StorageMode.Demo:
          await initializeDemoMode();
          break;
        case StorageMode.Cloud:
          initializeCloudMode();
          break;
      }

      setStorageMode(mode);
      setIsLoading(false);
    },
    [handleLogout, initializeLocalMode, initializeDemoMode, initializeCloudMode]
  );

  return (
    <storageModeContext.Provider
      value={{
        isLoading,
        storageMode,
        setStorageMode: handleSetStorageMode,
        dbContext,
      }}
    >
      {children}
    </storageModeContext.Provider>
  );
}

export const useStorageMode = () => {
  const context = useContext(storageModeContext);
  if (!context) {
    throw new Error("useStorageMode must be used within a StorageModeProvider");
  }
  return context;
};
