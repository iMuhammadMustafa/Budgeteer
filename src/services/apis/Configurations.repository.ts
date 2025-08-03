import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as real from "./supabase/Configurations.supa";
import * as mock from "./__mock__/Configurations.mock";

// Proxy hook to select real or mock API
export function useConfigurationsApi() {
  const demo = useDemoMode();
  return demo ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./supabase/Configurations.supa";
