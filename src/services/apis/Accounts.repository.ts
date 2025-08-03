import * as Real from "./supabase/Accounts.supa";
import * as Mock from "./__mock__/Accounts.mock";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Returns the correct API implementation based on demo mode
export function useAccountsApi() {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock : Real;
}

// For compatibility with existing imports, re-export all real API methods
export * from "./supabase/Accounts.supa";
