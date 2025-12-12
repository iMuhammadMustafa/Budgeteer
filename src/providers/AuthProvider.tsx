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
  tenantId?: string;
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
  const { storageMode, isDatabaseReady } = useStorageMode();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user ?? null;
  const isLoggedIn = !!user;

  const tenantId = session?.user?.app_metadata?.tenant_id;

  const fetchSession = useCallback(async () => {
    // Wait for StorageModeProvider to finish initialization
    if (!isDatabaseReady) {
      return;
    }

    // Only proceed if we have a valid storage mode
    if (storageMode === null) {
      setSession(null);
      return;
    }

    setIsLoading(true);

    try {
      switch (storageMode) {
        case StorageMode.Local:
          const localSession = await storage.getItem(STORAGE_KEYS.LOCAL_SESSION);
          if (localSession) {
            setSession(JSON.parse(localSession));
          } else {
            setSession(null);
          }
          break;
        case StorageMode.Demo:
          const demoSession = await storage.getItem(STORAGE_KEYS.DEMO_SESSION);
          if (demoSession) {
            setSession(JSON.parse(demoSession));
          } else {
            setSession(null);
          }
          break;
        case StorageMode.Cloud:
          const {
            data: { session: cloudSession },
          } = await supabase.auth.getSession();
          setSession(cloudSession ?? null);
          break;
        default:
          console.warn("Unknown storage mode:", storageMode);
          setSession(null);
          break;
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [storageMode, isDatabaseReady]);

  // Fetch session when storage mode and database are ready
  useEffect(() => {
    if (isDatabaseReady) {
      fetchSession();
    }
  }, [isDatabaseReady, storageMode, fetchSession]);

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
    if (storageMode === StorageMode.Cloud) {
      await supabase.auth.signOut();
    } else {
      await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
    }
    setSession(null);
    queryClient.clear();
    router.replace("/");
  }, [storageMode]);

  console.log({ session, user, tenantId, setSession: handleSetSession, isLoading, setIsLoading, isLoggedIn, logout });

  return (
    <AuthContext.Provider
      value={{ session, user, tenantId, setSession: handleSetSession, isLoading, setIsLoading, isLoggedIn, logout }}
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
