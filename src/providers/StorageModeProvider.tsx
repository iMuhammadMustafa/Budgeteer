import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { initializeWatermelonDB } from "@/src/types/database/watermelon";
import { seedWatermelonDB } from "@/src/types/database/watermelon/seed";
import { StorageMode } from "@/src/types/StorageMode";
import { storage } from "@/src/utils/storageUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seedWatermelonDemoDB } from "../types/database/watermelon/seedDemo";

type StorageModeContextType = {
  isLoading: boolean;
  storageMode: StorageMode | null;
  setStorageMode: (mode: StorageMode | null) => Promise<void>;
  isDatabaseReady: boolean;
  dbContext: IRepositoryFactory;
};

export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  DEMO_SESSION: "budgeteer-demo-session",
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

  // Initialize storage mode and database on mount
  useEffect(() => {
    const initializeStorageMode = async () => {
      setIsLoading(true);
      try {
        const mode = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);
        console.log("Fetched storage mode from storage:", mode);

        if (mode) {
          const parsedMode = mode as StorageMode;
          setStorageMode(parsedMode);

          // Initialize database based on the loaded mode
          console.log("Initializing database for storage mode:", parsedMode);
          if (parsedMode === StorageMode.Local) {
            await initializeWatermelonDB();
            await seedWatermelonDB();
          } else if (parsedMode === StorageMode.Demo) {
            await initializeWatermelonDB();
            await seedWatermelonDemoDB();
          }
        } else {
          // No saved mode yet - just mark as ready to let AuthProvider handle it
          setStorageMode(null);
        }
      } catch (error) {
        console.error("Error initializing storage mode:", error);
      } finally {
        setIsLoading(false);
        setIsDatabaseReady(true);
      }
    };

    initializeStorageMode();
  }, []);

  const handleSetStorageMode = useCallback(async (mode: StorageMode | null) => {
    setIsLoading(true);
    setIsDatabaseReady(false);

    try {
      if (!mode) {
        // Clearing storage mode
        setStorageMode(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
        setIsDatabaseReady(true);
        return;
      }

      // Save mode to storage first
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);

      // Initialize database based on mode
      if (mode === StorageMode.Local) {
        await initializeWatermelonDB();
        await seedWatermelonDB();
      } else if (mode === StorageMode.Demo) {
        await initializeWatermelonDB();
        await seedWatermelonDemoDB();
      }
      // Cloud mode doesn't need local database initialization

      // Update state after everything is initialized
      setStorageMode(mode);
    } catch (error) {
      console.error("Error setting storage mode:", error);
      // Revert on error
      setStorageMode(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.STORAGE_MODE);
    } finally {
      setIsLoading(false);
      setIsDatabaseReady(true);
    }
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
