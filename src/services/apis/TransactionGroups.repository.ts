// Proxy API for TransactionGroups: switches between real and mock based on demo mode

import * as Real from "./supabase/TransactionGroups.supa";
import * as Mock from "./__mock__/TransactionGroups.mock";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";

// Returns the correct API implementation based on demo mode
export function getTransactionGroupsApi() {
  return getDemoMode() ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/TransactionGroups.supa";
