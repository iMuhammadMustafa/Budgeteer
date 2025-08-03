import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as real from "./supabase/Recurrings.api.supa";
import * as mock from "./__mock__/Recurrings.mock";

// Proxy function to select real or mock API
export function getRecurringsApi() {
  return getDemoMode() ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Recurrings.api.supa";
