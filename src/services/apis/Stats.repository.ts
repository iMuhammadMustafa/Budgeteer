import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as real from "./supabase/Stats.supa";
import * as mock from "./__mock__/Stats.mock";

// Proxy hook to select real or mock API
export function useStatsApi() {
  const demo = useDemoMode();
  return demo ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Stats.supa";
