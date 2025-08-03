// Proxy API for TransactionCategories: switches between real and mock based on demo mode

import * as Real from "./supabase/TransactionCategories.supa";
import * as Mock from "./__mock__/TransactionCategories.mock";
import { getDemoMode } from "@/src/providers/DemoModeGlobal";

// Returns the correct API implementation based on demo mode
export function getTransactionCategoriesApi() {
  return getDemoMode() ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/TransactionCategories.supa";
