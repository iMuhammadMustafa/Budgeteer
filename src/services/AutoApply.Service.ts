import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import { AutoApplyEngine, IAutoApplyEngine } from "./AutoApplyEngine";
import { AutoApplyResult, AutoApplySettings, ApplyResult, BatchApplyResult } from "@/src/types/recurring";
import { Recurring } from "../types/db/Tables.Types";

/**
 * Service interface for auto-apply functionality
 */
export interface IAutoApplyService {
  // Core auto-apply operations
  checkAndApplyDueTransactions: () => ReturnType<typeof useMutation<AutoApplyResult, Error, void>>;
  getDueRecurringTransactions: (asOfDate?: Date) => ReturnType<typeof useQuery<Recurring[]>>;
  applyRecurringTransaction: () => ReturnType<typeof useMutation<ApplyResult, Error, { recurringId: string }>>;
  batchApplyTransactions: () => ReturnType<typeof useMutation<BatchApplyResult, Error, { recurringIds: string[] }>>;

  // Configuration management
  setAutoApplyEnabled: () => ReturnType<typeof useMutation<void, Error, { recurringId: string; enabled: boolean }>>;
  getAutoApplySettings: () => ReturnType<typeof useQuery<AutoApplySettings>>;
  updateAutoApplySettings: () => ReturnType<typeof useMutation<void, Error, Partial<AutoApplySettings>>>;

  // Engine instance for direct access if needed
  engine: IAutoApplyEngine;
}

/**
 * React hook for auto-apply service functionality
 */
export function useAutoApplyService(): IAutoApplyService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();

  // Create auto-apply engine instance
  const engine = new AutoApplyEngine(
    dbContext.RecurringRepository(),
    dbContext.TransactionRepository(),
    dbContext.AccountRepository(),
  );

  /**
   * Check and apply all due recurring transactions
   */
  const checkAndApplyDueTransactions = () => {
    return useMutation({
      mutationFn: async (): Promise<AutoApplyResult> => {
        return await engine.checkAndApplyDueTransactions(tenantId, userId);
      },
      onSuccess: async result => {
        // Invalidate relevant queries after successful auto-apply
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
          queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
          queryClient.invalidateQueries({ queryKey: ["auto-apply-due-transactions"] }),
        ]);

        console.log(
          `Auto-apply completed: ${result.appliedCount} applied, ${result.failedCount} failed, ${result.pendingCount} pending`,
        );
      },
      onError: error => {
        console.error("Error in auto-apply process:", error);
        throw error;
      },
    });
  };

  /**
   * Get due recurring transactions (for preview/monitoring)
   */
  const getDueRecurringTransactions = (asOfDate?: Date) => {
    return useQuery<Recurring[]>({
      queryKey: ["auto-apply-due-transactions", tenantId, asOfDate?.toISOString()],
      queryFn: async () => {
        return await engine.getDueRecurringTransactions(tenantId, asOfDate);
      },
      enabled: !!tenantId,
      staleTime: 5 * 60 * 1000, // 5 minutes - due transactions don't change frequently
    });
  };

  /**
   * Apply a single recurring transaction manually
   */
  const applyRecurringTransaction = () => {
    return useMutation({
      mutationFn: async ({ recurringId }: { recurringId: string }): Promise<ApplyResult> => {
        // First get the recurring transaction
        const recurringRepo = dbContext.RecurringRepository();
        const recurring = await recurringRepo.findById(recurringId, tenantId);

        if (!recurring) {
          throw new Error(`Recurring transaction not found: ${recurringId}`);
        }

        return await engine.applyRecurringTransaction(recurring, tenantId, userId);
      },
      onSuccess: async (result, variables) => {
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.recurringId, tenantId] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
          queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
          queryClient.invalidateQueries({ queryKey: ["auto-apply-due-transactions"] }),
        ]);

        if (result.success) {
          console.log(`Successfully applied recurring transaction: ${variables.recurringId}`);
        } else {
          console.warn(`Failed to apply recurring transaction: ${variables.recurringId} - ${result.error}`);
        }
      },
      onError: (error, variables) => {
        console.error(`Error applying recurring transaction ${variables.recurringId}:`, error);
        throw error;
      },
    });
  };

  /**
   * Apply multiple recurring transactions in batch
   */
  const batchApplyTransactions = () => {
    return useMutation({
      mutationFn: async ({ recurringIds }: { recurringIds: string[] }): Promise<BatchApplyResult> => {
        // Get all recurring transactions
        const recurringRepo = dbContext.RecurringRepository();
        const recurrings: Recurring[] = [];

        for (const id of recurringIds) {
          const recurring = await recurringRepo.findById(id, tenantId);
          if (recurring) {
            recurrings.push(recurring);
          }
        }

        if (recurrings.length === 0) {
          throw new Error("No valid recurring transactions found for batch processing");
        }

        return await engine.batchApplyTransactions(recurrings, tenantId, userId);
      },
      onSuccess: async (result, variables) => {
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
          queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
          queryClient.invalidateQueries({ queryKey: ["auto-apply-due-transactions"] }),
        ]);

        console.log(
          `Batch apply completed: ${result.summary.appliedCount} applied, ${result.summary.failedCount} failed`,
        );
      },
      onError: (error, variables) => {
        console.error(`Error in batch apply for transactions ${variables.recurringIds.join(", ")}:`, error);
        throw error;
      },
    });
  };

  /**
   * Enable or disable auto-apply for a specific recurring transaction
   */
  const setAutoApplyEnabled = () => {
    return useMutation({
      mutationFn: async ({ recurringId, enabled }: { recurringId: string; enabled: boolean }): Promise<void> => {
        await engine.setAutoApplyEnabled(recurringId, enabled, tenantId);
      },
      onSuccess: async (_, variables) => {
        // Invalidate recurring transaction queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] }),
          queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.recurringId, tenantId] }),
          queryClient.invalidateQueries({ queryKey: ["auto-apply-due-transactions"] }),
        ]);

        console.log(
          `Auto-apply ${variables.enabled ? "enabled" : "disabled"} for recurring transaction: ${variables.recurringId}`,
        );
      },
      onError: (error, variables) => {
        console.error(`Error updating auto-apply status for ${variables.recurringId}:`, error);
        throw error;
      },
    });
  };

  /**
   * Get current auto-apply settings
   */
  const getAutoApplySettings = () => {
    return useQuery<AutoApplySettings>({
      queryKey: ["auto-apply-settings"],
      queryFn: async () => {
        return engine.getAutoApplySettings();
      },
      staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change frequently
    });
  };

  /**
   * Update auto-apply settings
   */
  const updateAutoApplySettings = () => {
    return useMutation({
      mutationFn: async (settings: Partial<AutoApplySettings>): Promise<void> => {
        engine.updateAutoApplySettings(settings);
      },
      onSuccess: async () => {
        // Invalidate settings query
        await queryClient.invalidateQueries({ queryKey: ["auto-apply-settings"] });
        console.log("Auto-apply settings updated successfully");
      },
      onError: error => {
        console.error("Error updating auto-apply settings:", error);
        throw error;
      },
    });
  };

  return {
    checkAndApplyDueTransactions,
    getDueRecurringTransactions,
    applyRecurringTransaction,
    batchApplyTransactions,
    setAutoApplyEnabled,
    getAutoApplySettings,
    updateAutoApplySettings,
    engine,
  };
}

/**
 * Utility function to initialize auto-apply on app startup
 * This should be called from the app's main layout or startup sequence
 */
export const initializeAutoApplyOnStartup = async (
  autoApplyService: IAutoApplyService,
  options: {
    enableLogging?: boolean;
    skipOnError?: boolean;
  } = {},
): Promise<AutoApplyResult | null> => {
  const { enableLogging = true, skipOnError = true } = options;

  try {
    if (enableLogging) {
      console.log("Initializing auto-apply on app startup...");
    }

    // Get the mutation function
    const checkAndApplyMutation = autoApplyService.checkAndApplyDueTransactions();

    // Execute the auto-apply check
    const result = await new Promise<AutoApplyResult>((resolve, reject) => {
      checkAndApplyMutation.mutate(undefined, {
        onSuccess: data => resolve(data),
        onError: error => reject(error),
      });
    });

    if (enableLogging) {
      console.log("Auto-apply startup completed:", {
        applied: result.appliedCount,
        failed: result.failedCount,
        pending: result.pendingCount,
      });
    }

    return result;
  } catch (error) {
    if (enableLogging) {
      console.error("Auto-apply startup failed:", error);
    }

    if (skipOnError) {
      return null; // Don't block app startup on auto-apply errors
    } else {
      throw error;
    }
  }
};

/**
 * Hook for monitoring auto-apply status and due transactions
 */
export function useAutoApplyMonitoring() {
  const autoApplyService = useAutoApplyService();

  const dueTransactions = autoApplyService.getDueRecurringTransactions();
  const settings = autoApplyService.getAutoApplySettings();

  const autoApplyEnabled = dueTransactions.data?.filter(t => t.autoapplyenabled) || [];
  const pendingTransactions = dueTransactions.data?.filter(t => !t.autoapplyenabled) || [];

  return {
    dueTransactions: dueTransactions.data || [],
    autoApplyEnabled,
    pendingTransactions,
    settings: settings.data,
    isLoading: dueTransactions.isLoading || settings.isLoading,
    error: dueTransactions.error || settings.error,
    refetch: () => {
      dueTransactions.refetch();
      settings.refetch();
    },
  };
}
