import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as real from "./Configurations.api.real";
import * as mock from "./__mock__/Configurations.api";

// Proxy hook to select real or mock API
export function useConfigurationsApi() {
  const demo = useDemoMode();
  return demo ? mock : real;
}

// Re-export all real API methods for compatibility
export * from "./Configurations.api.real";
