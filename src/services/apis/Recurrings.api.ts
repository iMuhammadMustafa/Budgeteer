import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as real from "./Recurrings.api.real";
import * as mock from "./__mock__/Recurrings.api";

// Proxy hook to select real or mock API
export function useRecurringsApi() {
  const demo = useDemoMode();
  return demo ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./Recurrings.api.real";
