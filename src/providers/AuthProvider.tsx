import { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storage } from "../utils/storageUtils";
import { STORAGE_KEYS, StorageMode, useStorageMode } from "./StorageModeProvider";
import supabase from "./Supabase";

interface AuthContextType {
  session: Session | null;
  user: Session["user"] | null;
  setSession: (newSession: Session | null, currentStorageMode: StorageMode | null) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>({
  session: null,
  user: null,
  setSession: async () => {},
  isLoading: false,
  setIsLoading: () => {},
  isLoggedIn: false,
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { storageMode, isDatabaseReady } = useStorageMode();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user ?? null;
  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchSession = async () => {
      if (storageMode === null || !isDatabaseReady) {
        setSession(null);
        return;
      }
      setIsLoading(true);

      switch (storageMode) {
        case StorageMode.Local:
          const localSession = await storage.getItem(STORAGE_KEYS.LOCAL_SESSION);
          if (localSession) {
            setSession(JSON.parse(localSession));
          }
          break;
        case StorageMode.Demo:
          console.log("Using demo storage mode");
          break;
        case StorageMode.Cloud:
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (session) setSession(session);
          break;
        default:
          console.warn("Unknown storage mode:", storageMode);
          break;
      }
      setIsLoading(false);
    };

    fetchSession();
  }, [storageMode, isDatabaseReady]);

  const handleSetSession = useCallback(async (newSession: Session | null, newStorageMode: StorageMode | null) => {
    if (newStorageMode === StorageMode.Local || newStorageMode === StorageMode.Demo) {
      await storage.setItem(STORAGE_KEYS.LOCAL_SESSION, JSON.stringify(newSession));
    } else {
      await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
    }

    setSession(newSession);

    if (newSession) return;

    if (newStorageMode === StorageMode.Cloud) {
      await supabase.auth.signOut();
    } else {
      return await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, setSession: handleSetSession, isLoading, setIsLoading, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
