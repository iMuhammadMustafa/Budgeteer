// Proxy API for TransactionCategories: switches between real and mock based on demo mode

import * as Real from "./TransactionCategories.api.real";
import * as Mock from "./__mock__/TransactionCategories.api";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Returns the correct API implementation based on demo mode
export function useTransactionCategoriesApi() {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./TransactionCategories.api.real";
