import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "./Supabase";
import { getStorageMode } from "./DemoModeGlobal";

type AuthType = {
  session: Session | null;
  user?: Session["user"];
  isSessionLoading: boolean;
  setSession?: (session: Session | null) => void;
};

const AuthContext = createContext<AuthType>({
  session: null,
  isSessionLoading: true,
  setSession: undefined,
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const user = session?.user;
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const currentMode = getStorageMode();
      
      // Only fetch Supabase session for cloud mode
      if (currentMode === 'cloud') {
        const { data, error } = await supabase.auth.getSession();
        setSession(data.session);
      } else {
        // For demo and local modes, session will be set manually
        setSession(null);
      }
      
      setIsSessionLoading(false);
    };

    // Only listen to Supabase auth changes in cloud mode
    const currentMode = getStorageMode();
    if (currentMode === 'cloud') {
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
    }
    
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isSessionLoading, setSession }}>{children}</AuthContext.Provider>
  );
}
// export const useAuth = () => useContext(AuthContext);
export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("useAuth must be used within an AuthProvider");
  return authContext;
};
