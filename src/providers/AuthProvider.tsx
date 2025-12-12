import { StorageMode } from "@/src/types/StorageMode";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storage } from "../utils/storageUtils";
import { queryClient } from "./QueryProvider";
import { STORAGE_KEYS, useStorageMode } from "./StorageModeProvider";
import supabase from "./Supabase";

interface AuthContextType {
  session: Session | null;
  user: Session["user"] | null;
  setSession: (newSession: Session | null, currentStorageMode: StorageMode | null) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>({
  session: null,
  user: null,
  setSession: async () => {},
  isLoading: false,
  setIsLoading: () => {},
  isLoggedIn: false,
  logout: async () => {},
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { storageMode, isLoading: isStorageLoading, setStorageMode } = useStorageMode();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = session?.user ?? null;
  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchSession = async () => {
      if (isStorageLoading) return;

      if (storageMode === null) {
        setSession(null);
        setIsLoading(false);
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
          const demoSession = await storage.getItem(STORAGE_KEYS.LOCAL_SESSION);
          if (demoSession) {
            setSession(JSON.parse(demoSession));
          }
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
  }, [storageMode, isStorageLoading]);

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

  const logout = useCallback(async () => {
    switch (storageMode) {
      case StorageMode.Local:
        await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
      case StorageMode.Demo:
        await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
        break;
      case StorageMode.Cloud:
        await supabase.auth.signOut();
        break;
    }
    setSession(null);
    queryClient.clear();
    queryClient.resetQueries();
    router.replace("/");
  }, [storageMode]);

  return (
    <AuthContext.Provider
      value={{ session, user, setSession: handleSetSession, isLoading, setIsLoading, isLoggedIn, logout }}
    >
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
