import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as real from "./supabase/Stats.supa";
import * as mock from "./__mock__/Stats.mock";

// Proxy function to select real or mock API
export function getStatsApi() {
  return getDemoMode() ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Stats.supa";
