import * as Real from "./Accounts.Repository";
import * as Mock from "./__mock__/Accounts.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, otherwise use real
export const useGetAccounts = (...args: Parameters<typeof Real.useGetAccounts>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAccounts(...args) : Real.useGetAccounts(...args);
};

export const useGetTotalAccountBalance = (...args: Parameters<typeof Real.useGetTotalAccountBalance>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetTotalAccountBalance(...args) : Real.useGetTotalAccountBalance(...args);
};

export const useGetAccountById = (...args: Parameters<typeof Real.useGetAccountById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAccountById(...args) : Real.useGetAccountById(...args);
};

export const useGetAccountOpenedTransaction = (...args: Parameters<typeof Real.useGetAccountOpenedTransaction>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAccountOpenedTransaction(...args) : Real.useGetAccountOpenedTransaction(...args);
};

export const useCreateAccount = (...args: Parameters<typeof Real.useCreateAccount>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateAccount(...args) : Real.useCreateAccount(...args);
};

export const useUpdateAccount = (...args: Parameters<typeof Real.useUpdateAccount>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateAccount(...args) : Real.useUpdateAccount(...args);
};

export const useUpsertAccount = (...args: Parameters<typeof Real.useUpsertAccount>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertAccount(...args) : Real.useUpsertAccount(...args);
};

export const useDeleteAccount = (...args: Parameters<typeof Real.useDeleteAccount>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteAccount(...args) : Real.useDeleteAccount(...args);
};

export const useRestoreAccount = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreAccount() : Real.useRestoreAccount();
};

export const useUpdateAccountOpenedTransaction = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateAccountOpenedTransaction() : Real.useUpdateAccountOpenedTransaction();
};

// Export any other real hooks/helpers by default
export * from "./Accounts.Repository";
