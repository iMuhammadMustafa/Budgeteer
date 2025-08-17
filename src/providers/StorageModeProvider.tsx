import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { initializeSQLite, isSQLiteReady } from "./SQLite";

export enum StorageMode {
  Cloud = "cloud",
  Demo = "demo",
  Local = "local",
}
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
  const dbContext = createRepositoryFactory(storageMode);

  // Check if database is ready based on storage mode
  const isDatabaseReady = storageMode === StorageMode.Local ? isSQLiteReady() : true;

  const setStorageMode = async (mode: StorageMode) => {
    setIsInitializing(true);
    try {
      // Initialize SQLite if switching to Local mode
      if (mode === StorageMode.Local) {
        await initializeSQLite();
        console.log("SQLite initialized for Local storage mode");
      }

      setStorageModeState(mode);
    } catch (error) {
      console.error("Failed to set storage mode:", error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Initialize with current global mode
    const initializeCurrentMode = async () => {
      if (storageMode === StorageMode.Local && !isSQLiteReady()) {
        try {
          setIsInitializing(true);
          await initializeSQLite();
          console.log("SQLite initialized on startup");
        } catch (error) {
          console.error("Failed to initialize SQLite on startup:", error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeCurrentMode();
  }, [storageMode]);

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
