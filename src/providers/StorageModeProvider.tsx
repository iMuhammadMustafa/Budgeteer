import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { createRepositoryFactory, IRepositoryFactory } from "@/src/repositories/RepositoryFactory";

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
};

const StorageModeContext = createContext<StorageModeContextType | undefined>(undefined);

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const [storageMode, setStorageModeState] = useState<StorageMode>(StorageMode.Cloud);
  const [isInitializing, setIsInitializing] = useState(false);
  const dbContext = createRepositoryFactory(storageMode);

  const setStorageMode = async (mode: StorageMode) => {
    setIsInitializing(true);
    try {
      //   await setGlobalStorageMode(mode);
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
    // const currentMode = getStorageMode();
    setStorageModeState(storageMode);
  }, [storageMode]);

  return (
    <StorageModeContext.Provider value={{ storageMode, setStorageMode, isInitializing, dbContext }}>
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
