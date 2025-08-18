import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./Supabase";
import { storage, STORAGE_KEYS } from "@/src/utils/storageUtils";
import { useStorageMode } from "./StorageModeProvider";
import { StorageMode } from "@/src/types/StorageMode";

type AuthType = {
  session: Session | null;
  user?: Session["user"];
  isSessionLoading: boolean;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  session: null,
  isSessionLoading: true,
  setSession: () => {},
  logout: () => Promise.resolve(),
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const { storageMode, setStorageMode } = useStorageMode();
  const user = session?.user;
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Enhanced setSession that handles local storage
  const handleSessionChange = async (newSession: Session | null) => {
    setSession(newSession);

    if (storageMode === StorageMode.Local || storageMode === StorageMode.Demo) {
      if (newSession) {
        console.log("setting", newSession);
        await storage.setItem(STORAGE_KEYS.LOCAL_SESSION, JSON.stringify(newSession));
      }
    }
  };

  // Logout function that handles both cloud and local sessions
  const logout = async () => {
    try {
      // Sign out from Supabase if in cloud mode
      if (storageMode === StorageMode.Cloud) {
        await supabase.auth.signOut();
      }

      // Clear local session
      // await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);

      // Clear session state
      setSession(null);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for Supabase session first (Cloud mode)
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          // We have a valid Supabase session
          setSession(data.session);
          await setStorageMode(StorageMode.Cloud);
        } else {
          // No Supabase session, check for local session
          const localSessionData = await storage.getItem(STORAGE_KEYS.LOCAL_SESSION);
          if (localSessionData) {
            try {
              const localSession = JSON.parse(localSessionData);
              setSession(localSession);
              // Keep the current storage mode from StorageModeProvider
            } catch (error) {
              console.error("Failed to parse local session:", error);
              await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsSessionLoading(false);
      }
    };

    // Listen for Supabase auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
      if (supabaseSession) {
        // Supabase session available - switch to cloud mode
        setSession(supabaseSession);
        await setStorageMode(StorageMode.Cloud);
        // Clear any local session when switching to cloud
        await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
      } else if (storageMode === StorageMode.Cloud) {
        // Supabase session lost and we were in cloud mode
        setSession(null);
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [setStorageMode, storageMode]);

  return (
    <AuthContext.Provider value={{ session, user, isSessionLoading, setSession: handleSessionChange, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// export const useAuth = () => useContext(AuthContext);
export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("useAuth must be used within an AuthProvider");
  return authContext;
};
