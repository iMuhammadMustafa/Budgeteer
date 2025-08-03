// Proxy API for TransactionGroups: switches between real and mock based on demo mode

import * as Real from "./TransactionGroups.api.real";
import * as Mock from "./__mock__/TransactionGroups.api";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Returns the correct API implementation based on demo mode
export function useTransactionGroupsApi() {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock : Real;
}

// Re-export all real API methods for compatibility
export * from "./TransactionGroups.api.real";
