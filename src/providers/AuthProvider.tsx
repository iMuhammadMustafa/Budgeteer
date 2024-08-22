import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

type AuthType = {
  session: Session | null;
  isSessionLoading: boolean;
};

const AuthContext = createContext<AuthType>({
  session: null,
  isSessionLoading: true,
});

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      setIsSessionLoading(false);
    };
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    fetchSession();
  }, []);

  return <AuthContext.Provider value={{ session, isSessionLoading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
// export const useAuth = () => {
//   if (!AuthContext) throw new Error("useAuth must be used within an AuthProvider");
//   return useContext(AuthContext);
// };
