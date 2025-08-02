import * as Real from "./TransactionGroups.Repository";
import * as Mock from "./__mock__/TransactionGroups.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, otherwise use real
export const useGetTransactionGroups = (...args: Parameters<typeof Real.useGetTransactionGroups>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionGroups(...args) : Real.useGetTransactionGroups(...args);
};

export const useGetTransactionGroupById = (...args: Parameters<typeof Real.useGetTransactionGroupById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionGroupById(...args) : Real.useGetTransactionGroupById(...args);
};

export const useCreateTransactionGroup = (...args: Parameters<typeof Real.useCreateTransactionGroup>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateTransactionGroup(...args) : Real.useCreateTransactionGroup(...args);
};

export const useUpdateTransactionGroup = (...args: Parameters<typeof Real.useUpdateTransactionGroup>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateTransactionGroup(...args) : Real.useUpdateTransactionGroup(...args);
};

export const useUpsertTransactionGroup = (...args: Parameters<typeof Real.useUpsertTransactionGroup>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertTransactionGroup(...args) : Real.useUpsertTransactionGroup(...args);
};

export const useDeleteTransactionGroup = (...args: Parameters<typeof Real.useDeleteTransactionGroup>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteTransactionGroup(...args) : Real.useDeleteTransactionGroup(...args);
};

export const useRestoreTransactionGroup = (id?: string) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreTransactionGroup() : Real.useRestoreTransactionGroup(id);
};

// Export any other real hooks/helpers by default
export * from "./TransactionGroups.Repository";
