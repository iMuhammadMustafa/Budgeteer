import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { initializeWatermelonDB } from "@/src/types/database/watermelon";
import { seedWatermelonDB } from "@/src/types/database/watermelon/seed";
import { StorageMode } from "@/src/types/StorageMode";
import { storage } from "@/src/utils/storageUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type StorageModeContextType = {
  isLoading: boolean;
  storageMode: StorageMode | null;
  setStorageMode: (mode: StorageMode | null) => Promise<void>;
  isDatabaseReady: boolean;
  dbContext: IRepositoryFactory;
};

export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  STORAGE_MODE: "budgeteer-storage-mode",
} as const;

const storageModeContext = createContext<StorageModeContextType | undefined>({
  isLoading: false,
  storageMode: null,
  setStorageMode: async (mode: StorageMode | null) => {},
  isDatabaseReady: false,
  dbContext: null as any,
});

export default function StorageModeProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const dbContext = useMemo(() => createRepositoryFactory(storageMode), [storageMode]);

  useEffect(() => {
    const fetchStorageMode = async () => {
      setIsLoading(true);
      const mode = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);
      if (mode) {
        setStorageMode(mode as StorageMode);
      }
      setIsLoading(false);
      setIsDatabaseReady(true);
    };

    fetchStorageMode();
  }, []);

  const handleSetStorageMode = useCallback(async (mode: StorageMode | null) => {
    if (!mode) {
      setStorageMode(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
      return;
    }

    setIsLoading(true);
    setIsDatabaseReady(false);
    await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);

    if (mode === StorageMode.Local) {
      await initializeWatermelonDB();

      await seedWatermelonDB();
    }
    setStorageMode(mode);
    setIsLoading(false);
    setIsDatabaseReady(true);
  }, []);

  return (
    <storageModeContext.Provider
      value={{
        isLoading,
        storageMode: storageMode,
        setStorageMode: handleSetStorageMode,
        isDatabaseReady: isDatabaseReady,
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
