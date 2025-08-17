import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./Supabase";
import { storage, STORAGE_KEYS } from "@/src/utils/storageUtils";

type AuthType = {
  session: Session | null;
  user?: Session["user"];
  isSessionLoading: boolean;
  setSession?: (session: Session | null) => void;
  logout?: () => Promise<void>;
};

const AuthContext = createContext<AuthType>({
  session: null,
  isSessionLoading: true,
  setSession: undefined,
  logout: undefined,
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [storageMode, setStorageModeState] = useState<string>("cloud");
  const user = session?.user;
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Enhanced setSession that handles local storage
  const handleSessionChange = async (newSession: Session | null) => {
    setSession(newSession);

    if (storageMode === "local" || storageMode === "demo") {
      if (newSession) {
        await storage.setItem(STORAGE_KEYS.LOCAL_SESSION, JSON.stringify(newSession));
      }
    }
  };

  // Logout function that handles both cloud and local sessions
  const logout = async () => {
    try {
      // Sign out from Supabase if in cloud mode
      if (storageMode === "cloud") {
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
        // Load storage mode from storage
        const savedStorageMode = await storage.getItem(STORAGE_KEYS.STORAGE_MODE);
        if (savedStorageMode) {
          setStorageModeState(savedStorageMode);
        }

        // Check for Supabase session first (Cloud mode)
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          // We have a valid Supabase session
          setSession(data.session);
          setStorageModeState("cloud");
          await storage.setItem(STORAGE_KEYS.STORAGE_MODE, "cloud");
        } else {
          // No Supabase session, check for local session
          const localSessionData = await storage.getItem(STORAGE_KEYS.LOCAL_SESSION);
          if (localSessionData) {
            try {
              const localSession = JSON.parse(localSessionData);
              setSession(localSession);
              // Keep the saved storage mode (Demo or Local)
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
        setStorageModeState("cloud");
        await storage.setItem(STORAGE_KEYS.STORAGE_MODE, "cloud");
        // Clear any local session when switching to cloud
        await storage.removeItem(STORAGE_KEYS.LOCAL_SESSION);
      } else if (storageMode === "cloud") {
        // Supabase session lost and we were in cloud mode
        setSession(null);
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update storage mode when it changes
  useEffect(() => {
    const updateStorageMode = async () => {
      await storage.setItem(STORAGE_KEYS.STORAGE_MODE, storageMode);
    };
    updateStorageMode();
  }, [storageMode]);

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
