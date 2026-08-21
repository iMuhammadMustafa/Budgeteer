import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";

import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database//TableNames";
import { Recurring } from "@/src/types/database//Tables.Types";
import { resolveTenantId } from "@/src/utils/tenant";

import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import {
  ApplyResult,
  executeRecurringHelper,
  ExecutionOverrides,
  getNextOccurrence,
} from "./helpers/recurrings.helpers";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";
import { queryKeys } from "./queryKeys";

export {
  executeRecurringHelper,
  getNextOccurrence,
  parseRecurrenceRule,
  RecurringType,
} from "./helpers/recurrings.helpers";
export type { ApplyResult, ExecutionOverrides, RecurrenceFrequency } from "./helpers/recurrings.helpers";

export interface IRecurringService extends IService<Recurring, TableNames.Recurrings> {
  useExecuteRecurring: () => ReturnType<
    typeof useMutation<ApplyResult, Error, { recurring: Recurring; overrides?: ExecutionOverrides }>
  >;
  useSkipRecurring: () => ReturnType<typeof useMutation<Recurring, Error, { recurring: Recurring }>>;
}

export function useRecurringService(): IRecurringService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = resolveTenantId(session);
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const recurringRepo = dbContext.RecurringRepository();
  const transactionRepo = dbContext.TransactionRepository();
  const accountRepo = dbContext.AccountRepository();

  const useExecuteRecurring = () => {
    return useMutation({
      mutationFn: async ({ recurring, overrides }: { recurring: Recurring; overrides?: ExecutionOverrides }) => {
        return await executeRecurringHelper(recurring, overrides, session, recurringRepo, transactionRepo, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.recurrings.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.viewAll });
        await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      },
      onError: error => {
        console.error("Error executing recurring:", error);
        throw error;
      },
    });
  };

  const useSkipRecurring = () => {
    return useMutation({
      mutationFn: async ({ recurring }: { recurring: Recurring }) => {
        const userId = session!.user.id;

        if (!recurring.nextoccurrencedate || !recurring.recurrencerule) {
          throw new Error("Cannot skip: recurring has no next occurrence date or recurrence rule");
        }

        const nextDate = getNextOccurrence(recurring.nextoccurrencedate, recurring.recurrencerule).toISOString();

        const updateData: any = {
          nextoccurrencedate: nextDate,
          updatedby: userId,
          updatedat: dayjs().toISOString(),
        };

        const updated = await recurringRepo.update(recurring.id, updateData, tenantId);
        if (!updated) throw new Error("Failed to update recurring");
        return updated;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.recurrings.all });
      },
      onError: error => {
        console.error("Error skipping recurring:", error);
        throw error;
      },
    });
  };

  return {
    ...createServiceHooks<Recurring, TableNames.Recurrings>(TableNames.Recurrings, recurringRepo, tenantId, session),
    useExecuteRecurring,
    useSkipRecurring,
  };
}
