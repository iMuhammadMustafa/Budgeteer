import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { StorageMode } from "@/src/services/storage/types";
import { setStorageMode as setGlobalStorageMode, getStorageMode } from "./DemoModeGlobal";

type StorageModeContextType = {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  isInitializing: boolean;
};

const StorageModeContext = createContext<StorageModeContextType | undefined>(undefined);

export function StorageModeProvider({ children }: { children: ReactNode }) {
  const [storageMode, setStorageModeState] = useState<StorageMode>('cloud');
  const [isInitializing, setIsInitializing] = useState(false);

  const setStorageMode = async (mode: StorageMode) => {
    setIsInitializing(true);
    try {
      await setGlobalStorageMode(mode);
      setStorageModeState(mode);
    } catch (error) {
      console.error('Failed to set storage mode:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Initialize with current global mode
    const currentMode = getStorageMode();
    setStorageModeState(currentMode);
  }, []);

  return (
    <StorageModeContext.Provider value={{ storageMode, setStorageMode, isInitializing }}>
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