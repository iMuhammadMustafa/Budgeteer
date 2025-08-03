import * as Real from "./supabase/Accounts.supa";
import * as Mock from "./__mock__/Accounts.mock";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";

// Returns the correct API implementation based on demo mode
export function getAccountsApi() {
  return getDemoMode() ? Mock : Real;
}

// For compatibility with existing imports, re-export all real API methods
export * from "./supabase/Accounts.supa";
