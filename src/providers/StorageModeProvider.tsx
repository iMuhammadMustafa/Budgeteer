import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from "react";
import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { initializeWatermelonDB, isWatermelonDBReady } from "@/src/database";
import { storage, STORAGE_KEYS } from "@/src/utils/storageUtils";
import { StorageMode } from "@/src/types/StorageMode";

type StorageModeContextType = {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  isInitializing: boolean;
  dbContext: IRepositoryFactory;
  isDatabaseReady: boolean;
};

const StorageModeContext = createContext<StorageModeContextType | undefined>(undefined);

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const [storageMode, setStorageModeState] = useState<StorageMode>(StorageMode.Cloud);
  const [isInitializing, setIsInitializing] = useState(false);

  // Memoize the repository factory to avoid recreating on every render
  const dbContext = useMemo(() => createRepositoryFactory(storageMode), [storageMode]);

  // Memoize the database ready check to avoid unnecessary function calls
  const isDatabaseReady = useMemo(() => {
    return storageMode === StorageMode.Local ? isWatermelonDBReady() : true;
  }, [storageMode]);

  const setStorageMode = async (mode: StorageMode) => {
    setIsInitializing(true);
    try {
      // Initialize WatermelonDB if switching to Local mode
      if (mode === StorageMode.Local) {
        await initializeWatermelonDB();
        console.log("WatermelonDB initialized for Local storage mode");
      }

      setStorageModeState(mode);

      // Store the storage mode preference
      await storage.setItem(STORAGE_KEYS.STORAGE_MODE, mode);
    } catch (error) {
      console.error("Failed to set storage mode:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Initialize with saved storage mode or default to Cloud
    const initializeCurrentMode = async () => {
      try {
        // Load saved storage mode
        const savedMode = (await storage.getItem(STORAGE_KEYS.STORAGE_MODE)) as StorageMode;
        if (savedMode && Object.values(StorageMode).includes(savedMode)) {
          setStorageModeState(savedMode);

          // Initialize WatermelonDB if needed
          if (savedMode === StorageMode.Local && !isWatermelonDBReady()) {
            setIsInitializing(true);
            await initializeWatermelonDB();
            console.log("WatermelonDB initialized on startup");
          }
        }
      } catch (error) {
        console.error("Failed to initialize storage mode:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCurrentMode();
  }, []);

  return (
    <StorageModeContext.Provider value={{ storageMode, setStorageMode, isInitializing, dbContext, isDatabaseReady }}>
      {children}
    </StorageModeContext.Provider>
  );
}

export function useStorageMode() {
  const context = useContext(StorageModeContext);
  if (!context) {
    throw new Error("useStorageMode must be used within a StorageModeProvider");
  }
  return context;
}
