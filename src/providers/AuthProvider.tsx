import { StorageMode } from "@/src/types/StorageMode";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storage } from "../utils/storageUtils";
import { useQueryClient } from "./QueryProvider";
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
  const { storageMode, isDatabaseReady } = useStorageMode();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user ?? null;
  const isLoggedIn = !!user;
  const queryClient = useQueryClient();

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

  const logout = useCallback(async () => {
    if (storageMode === StorageMode.Cloud) {
      await supabase.auth.signOut();
    } else {
      await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
    }
    setSession(null);
    queryClient.clear();
    router.replace("/");
  }, [storageMode, queryClient]);

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
