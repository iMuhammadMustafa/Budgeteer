// Proxy API for Transactions: switches between real and mock based on demo mode

import * as Real from "./supabase/Transactions.supa";
import * as Mock from "./__mock__/Transactions.mock";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Returns the correct API implementation based on demo mode
export function useTransactionsApi() {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Transactions.supa";
