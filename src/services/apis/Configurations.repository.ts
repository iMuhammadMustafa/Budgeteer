import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as real from "./supabase/Configurations.supa";
import * as mock from "./__mock__/Configurations.mock";

// Proxy function to select real or mock API
export function getConfigurationsApi() {
  return getDemoMode() ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Configurations.supa";
