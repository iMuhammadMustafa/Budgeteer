import * as Real from "./Transactions.Service";
import * as Mock from "./__mock__/Transactions.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, otherwise use real
export const useGetAllTransactions = (...args: Parameters<typeof Real.useGetAllTransactions>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAllTransactions(...args) : Real.useGetAllTransactions(...args);
};

export const useGetTransactions = (...args: Parameters<typeof Real.useGetTransactions>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactions(...args) : Real.useGetTransactions(...args);
};

export const useGetTransactionsInfinite = (...args: Parameters<typeof Real.useGetTransactionsInfinite>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionsInfinite(...args) : Real.useGetTransactionsInfinite(...args);
};

export const useGetTransactionById = (...args: Parameters<typeof Real.useGetTransactionById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTransactionById(...args) : Real.useGetTransactionById(...args);
};

export const useCreateTransaction = (...args: Parameters<typeof Real.useCreateTransaction>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateTransaction(...args) : Real.useCreateTransaction(...args);
};

export const useCreateTransactions = (...args: Parameters<typeof Real.useCreateTransactions>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateTransactions(...args) : Real.useCreateTransactions(...args);
};

export const useUpdateTransaction = (...args: Parameters<typeof Real.useUpdateTransaction>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateTransaction(...args) : Real.useUpdateTransaction(...args);
};

export const useUpsertTransaction = (...args: Parameters<typeof Real.useUpsertTransaction>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertTransaction(...args) : Real.useUpsertTransaction(...args);
};

export const useDeleteTransaction = (...args: Parameters<typeof Real.useDeleteTransaction>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteTransaction(...args) : Real.useDeleteTransaction(...args);
};

export const useRestoreTransaction = (id?: string) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreTransaction() : Real.useRestoreTransaction(id);
};

// Export any other real hooks/helpers by default
export * from "./Transactions.Service";
