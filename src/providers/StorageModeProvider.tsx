import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { clearSqliteDataByTenant, initializeSqliteDBAsync } from "@/src/types/database/sqlite";
import { SQLITE_DEMO_TENANT_ID } from "@/src/types/database/sqlite/constants";
import { seedSqliteDB } from "@/src/types/database/sqlite/seed";
import { seedSqliteDemoDB, setDemoSeededFlag } from "@/src/types/database/sqlite/seedDemo";
import { StorageMode } from "@/src/types/StorageMode";
import { buildLocalSession } from "@/src/utils/localSession";
import { storage } from "@/src/utils/storageUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PERSIST_CACHE_KEY, queryClient } from "./QueryProvider";

type StorageModeContextType = {
  isLoading: boolean;
  storageMode: StorageMode | null;
  setStorageMode: (mode: StorageMode | null) => Promise<boolean>;
  dbContext: IRepositoryFactory;
};

export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  STORAGE_MODE: "budgeteer-storage-mode",
} as const;

/**
 * Test-only fallback (Phase 5.1): let E2E preselect a storage mode via
 * `?storageMode=local|cloud|demo` in the URL instead of clicking the landing
 * page, so tests can jump straight in and parallelize by mode. Consulted ONLY
 * when nothing is stored yet — a real user hitting the app root has no such
 * param, so production UX is unchanged.
 */
function resolveInjectedStorageMode(): StorageMode | null {
  if (typeof window === "undefined" || !window.location?.search) return null;
  try {
    const param = new URLSearchParams(window.location.search).get("storageMode");
    if (!param) return null;
    const valid: string[] = [StorageMode.Local, StorageMode.Cloud, StorageMode.Demo];
    return valid.includes(param) ? (param as StorageMode) : null;
  } catch {
    return null;
  }
}

const storageModeContext = createContext<StorageModeContextType | undefined>({
  isLoading: false,
  storageMode: null,
  setStorageMode: async (mode: StorageMode | null) => true,
  dbContext: null as any,
});

export default function StorageModeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const dbContext = useMemo(() => createRepositoryFactory(storageMode), [storageMode]);

  useEffect(() => {
    const fetchStorageMode = async () => {
      const stored = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);
      // Only fall back to URL injection when nothing has been selected yet.
      const injected = !stored ? resolveInjectedStorageMode() : null;
      const mode = (stored ?? injected) as StorageMode | null;

      // Re-run demo seed on every startup so version-bumped seed additions are applied
      // to users who were already in Demo mode before new seed data was added.
      // All INSERTs use OR IGNORE so existing data is never duplicated.
      if (mode === StorageMode.Demo) {
        await initializeSqliteDBAsync();
        await seedSqliteDemoDB();
      }

      // An injected mode was never set up via the landing page, so persist it,
      // initialize/seed its backend, and (for Local/Demo) seed the synthetic
      // session that AuthProvider restores — landing the caller straight in the
      // app with no click. Test-only path; all steps idempotent.
      if (injected) {
        await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, injected);
        if (injected === StorageMode.Local) {
          await initializeSqliteDBAsync();
          await seedSqliteDB();
        }
        if (injected === StorageMode.Local || injected === StorageMode.Demo) {
          await storage.setItem(STORAGE_KEYS.LOCAL_SESSION, JSON.stringify(buildLocalSession(injected)));
        }
      }

      setStorageMode(mode as StorageMode);
      setIsLoading(false);
    };
    fetchStorageMode();
  }, []);

  const handleSetStorageMode = useCallback(
    async (mode: StorageMode | null): Promise<boolean> => {
      if (!mode) {
        setStorageMode(null);

        if (storageMode === StorageMode.Demo) {
          await clearSqliteDataByTenant(SQLITE_DEMO_TENANT_ID);
          setDemoSeededFlag(false);
          await AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
        }

        await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
        // Drop cached query data (in-memory + persisted) so one backend's rows
        // can't bleed into the next mode or be resurrected from disk on restart.
        queryClient.clear();
        await AsyncStorage.removeItem(PERSIST_CACHE_KEY);
        return true;
      }

      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);

      try {
        if (mode === StorageMode.Local) {
          await initializeSqliteDBAsync();
          await seedSqliteDB();
        }
        if (mode === StorageMode.Demo) {
          await initializeSqliteDBAsync();
          await seedSqliteDemoDB();
        }
      } catch (error) {
        console.error(`Failed to initialize ${mode} storage:`, error);
        // Roll back so the user lands back on the mode-selection screen
        await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
        setStorageMode(null);
        setIsLoading(false);
        return false;
      }

      setStorageMode(mode);

      // New backend is initialized and mode state is set — purge the previous
      // backend's cached data (in-memory + persisted) so it can't render or be
      // resurrected from disk on restart.
      queryClient.clear();
      await AsyncStorage.removeItem(PERSIST_CACHE_KEY);

      setIsLoading(false);
      return true;
    },
    [storageMode],
  );

  const value = useMemo(
    () => ({ isLoading, storageMode, setStorageMode: handleSetStorageMode, dbContext }),
    [isLoading, storageMode, handleSetStorageMode, dbContext],
  );

  return <storageModeContext.Provider value={value}>{children}</storageModeContext.Provider>;
}
export const useStorageMode = () => {
  const context = useContext(storageModeContext);
  if (!context) {
    throw new Error("useStorageMode must be used within a StorageModeProvider");
  }
  return context;
};
