// Proxy API for Transactions: switches between real and mock based on demo mode

import * as Real from "./supabase/Transactions.supa";
import * as Mock from "./__mock__/Transactions.mock";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";

// Returns the correct API implementation based on demo mode
export function getTransactionsApi() {
  return getDemoMode() ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Transactions.supa";
