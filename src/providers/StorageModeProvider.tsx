import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { clearSqliteDataByTenant, initializeSqliteDBAsync } from "@/src/types/database/sqlite";
import { SQLITE_DEMO_TENANT_ID } from "@/src/types/database/sqlite/constants";
import { seedSqliteDB } from "@/src/types/database/sqlite/seed";
import { seedSqliteDemoDB, setDemoSeededFlag } from "@/src/types/database/sqlite/seedDemo";
import { StorageMode } from "@/src/types/StorageMode";
import { storage } from "@/src/utils/storageUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type StorageModeContextType = {
  isLoading: boolean;
  storageMode: StorageMode | null;
  setStorageMode: (mode: StorageMode | null) => Promise<void>;
  dbContext: IRepositoryFactory;
};

export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  STORAGE_MODE: "budgeteer-storage-mode",
} as const;

const storageModeContext = createContext<StorageModeContextType | undefined>({
  isLoading: false,
  storageMode: null,
  setStorageMode: async (mode: StorageMode | null) => { },
  dbContext: null as any,
});

export default function StorageModeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const dbContext = useMemo(() => createRepositoryFactory(storageMode), [storageMode]);

  useEffect(() => {
    const fetchStorageMode = async () => {
      const mode = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);
      setStorageMode(mode as StorageMode);
      setIsLoading(false);
    };
    fetchStorageMode();
  }, []);

  const handleSetStorageMode = useCallback(
    async (mode: StorageMode | null) => {
      if (!mode) {
        setStorageMode(null);

        if (storageMode === StorageMode.Demo) {
          await clearSqliteDataByTenant(SQLITE_DEMO_TENANT_ID);
          setDemoSeededFlag(false);
          await AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
        }

        await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
        return;
      }

      setIsLoading(true);
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);

      if (mode === StorageMode.Local) {
        await initializeSqliteDBAsync();
        await seedSqliteDB();
      }
      if (mode === StorageMode.Demo) {
        await initializeSqliteDBAsync();
        await seedSqliteDemoDB();
      }

      setStorageMode(mode);
      setIsLoading(false);
    },
    [storageMode],
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
