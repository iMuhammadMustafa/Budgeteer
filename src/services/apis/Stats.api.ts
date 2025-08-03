import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as real from "./Stats.api.real";
import * as mock from "./__mock__/Stats.api";

// Proxy hook to select real or mock API
export function useStatsApi() {
  const demo = useDemoMode();
  return demo ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./Stats.api.real";
