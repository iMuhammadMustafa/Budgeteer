import { createContext, useContext } from "react";

export enum StorageMode {
  Cloud = "cloud",
  Demo = "demo",
  Local = "local",
}
export const StorageModeConfig = {
  [StorageMode.Cloud]: {
    id: StorageMode.Cloud,
    title: "Cloud Mode",
    description: "Cloud database with sync. Login with Username and Password",
    icon: "☁️",
  },
  [StorageMode.Demo]: {
    id: StorageMode.Demo,
    title: "Demo Mode",
    description: "Try the app with sample data",
    icon: "🎮",
  },
  [StorageMode.Local]: {
    id: StorageMode.Local,
    title: "Local Mode",
    description: "Local device storage",
    icon: "💾",
  },
};

type StorageModeContextType = {
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  isInitializing: boolean;
  //   dbContext: IRepositoryFactory;
  isDatabaseReady: boolean;
};

const storageModeContext = createContext<StorageModeContextType | undefined>(undefined);

export default function StorageModeProvider({ children }: { children: React.ReactNode }) {
  return (
    <storageModeContext.Provider
      value={{
        storageMode: StorageMode.Cloud,
        setStorageMode: async () => {},
        isInitializing: false,
        isDatabaseReady: true,
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
