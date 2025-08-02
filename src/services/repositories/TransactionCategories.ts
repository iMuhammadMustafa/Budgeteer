import * as Real from "./TransactionCategories.Repository";
import * as Mock from "./__mock__/TransactionCategories.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, otherwise use real
export const useGetTransactionCategories = (...args: Parameters<typeof Real.useGetTransactionCategories>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionCategories(...args) : Real.useGetTransactionCategories(...args);
};

export const useGetTransactionCategoryById = (...args: Parameters<typeof Real.useGetTransactionCategoryById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionCategoryById(...args) : Real.useGetTransactionCategoryById(...args);
};

export const useCreateTransactionCategory = (...args: Parameters<typeof Real.useCreateTransactionCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateTransactionCategory(...args) : Real.useCreateTransactionCategory(...args);
};

export const useUpdateTransactionCategory = (...args: Parameters<typeof Real.useUpdateTransactionCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateTransactionCategory(...args) : Real.useUpdateTransactionCategory(...args);
};

export const useUpsertTransactionCategory = (...args: Parameters<typeof Real.useUpsertTransactionCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertTransactionCategory(...args) : Real.useUpsertTransactionCategory(...args);
};

export const useDeleteTransactionCategory = (...args: Parameters<typeof Real.useDeleteTransactionCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteTransactionCategory(...args) : Real.useDeleteTransactionCategory(...args);
};

export const useRestoreTransactionCategory = (id?: string) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreTransactionCategory() : Real.useRestoreTransactionCategory(id);
};

// Export any other real hooks/helpers by default
export * from "./TransactionCategories.Repository";
