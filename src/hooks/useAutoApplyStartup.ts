import { useEffect, useRef, useState } from "react";
import { useAutoApplyService } from "@/src/services/AutoApply.Service";
import { useNotifications } from "@/src/providers/NotificationsProvider";
import { AutoApplyResult } from "@/src/types/recurring";
import {
  AutoApplyStartupService,
  AutoApplyStartupConfig,
  AutoApplyStartupResult,
  createAutoApplyStartupService,
} from "@/src/services/AutoApplyStartupService";

interface AutoApplyStartupOptions extends Partial<AutoApplyStartupConfig> {
  // Additional hook-specific options can be added here
}

interface AutoApplyStartupState {
  isInitializing: boolean;
  isComplete: boolean;
  result: AutoApplyStartupResult | null;
  error: Error | null;
}

/**
 * Hook for managing auto-apply functionality on app startup
 * Provides efficient startup checking that doesn't block app loading
 */
export function useAutoApplyStartup(options: AutoApplyStartupOptions = {}) {
  const [state, setState] = useState<AutoApplyStartupState>({
    isInitializing: false,
    isComplete: false,
    result: null,
    error: null,
  });

  const autoApplyService = useAutoApplyService();
  const { addNotification } = useNotifications();
  const startupServiceRef = useRef<AutoApplyStartupService>(null);
  const hasInitialized = useRef(false);

  // Create startup service instance
  useEffect(() => {
    startupServiceRef.current = createAutoApplyStartupService(autoApplyService, { addNotification }, options);
  }, [autoApplyService, addNotification]);

  const initializeAutoApply = async () => {
    if (hasInitialized.current || !startupServiceRef.current) {
      return;
    }

    hasInitialized.current = true;
    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const result = await startupServiceRef.current.initializeOnStartup();

      setState(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        result,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        error: error as Error,
      }));

      throw error;
    }
  };

  // Manual trigger for testing or user-initiated checks
  const triggerManualCheck = async () => {
    if (!startupServiceRef.current) {
      throw new Error("Startup service not initialized");
    }

    if (startupServiceRef.current.isExecuting()) {
      console.log("[AutoApply Startup] Already in progress, skipping manual trigger");
      return startupServiceRef.current.getLastResult();
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const result = await startupServiceRef.current.triggerManualCheck();

      setState(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        result,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitializing: false,
        isComplete: true,
        error: error as Error,
      }));

      throw error;
    }
  };

  // Reset state for re-initialization
  const reset = () => {
    hasInitialized.current = false;
    setState({
      isInitializing: false,
      isComplete: false,
      result: null,
      error: null,
    });
  };

  // Update configuration
  const updateConfig = (newConfig: Partial<AutoApplyStartupConfig>) => {
    if (startupServiceRef.current) {
      startupServiceRef.current.updateConfig(newConfig);
    }
  };

  return {
    // State
    isInitializing: state.isInitializing,
    isComplete: state.isComplete,
    result: state.result,
    error: state.error,

    // Actions
    initialize: initializeAutoApply,
    triggerManualCheck,
    reset,
    updateConfig,

    // Computed values
    hasResults: state.result !== null,
    hasError: state.error !== null,
    isExecuting: startupServiceRef.current?.isExecuting() || false,
    lastResult: startupServiceRef.current?.getLastResult() || null,
    totalProcessed: state.result?.result
      ? state.result.result.appliedCount + state.result.result.failedCount + state.result.result.pendingCount
      : 0,
  };
}
export function useAutoApplyRecurrings(options: AutoApplyStartupOptions = {}) {
  const autoApplyStartup = useAutoApplyStartup(options);

  useEffect(() => {
    // Initialize auto-apply on mount
    autoApplyStartup.initialize().catch(error => {
      console.error("[AutoApply Startup] Initialization failed:", error);
    });
  }, []);
  useEffect(() => {
    if (autoApplyStartup.isComplete && autoApplyStartup.hasResults) {
      console.log("[AutoApply Startup] Initialization complete:", {
        totalProcessed: autoApplyStartup.totalProcessed,
        hasError: autoApplyStartup.hasError,
      });
    }
  }, [
    autoApplyStartup.isComplete,
    autoApplyStartup.hasResults,
    autoApplyStartup.totalProcessed,
    autoApplyStartup.hasError,
  ]);

  return autoApplyStartup;
}
