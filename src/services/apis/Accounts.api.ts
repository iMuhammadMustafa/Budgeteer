import * as Real from "./Accounts.api.real";
import * as Mock from "./__mock__/Accounts.api";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Returns the correct API implementation based on demo mode
export function useAccountsApi() {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock : Real;
}

// For compatibility with existing imports, re-export all real API methods
export * from "./Accounts.api.real";
