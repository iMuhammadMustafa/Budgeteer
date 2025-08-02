import * as Real from "./AccountCategories.Repository";
import * as Mock from "./__mock__/AccountCategories.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, otherwise use real
export const useGetAccountCategories = (...args: Parameters<typeof Real.useGetAccountCategories>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAccountCategories(...args) : Real.useGetAccountCategories(...args);
};

export const useGetAccountCategoryById = (...args: Parameters<typeof Real.useGetAccountCategoryById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetAccountCategoryById(...args) : Real.useGetAccountCategoryById(...args);
};

export const useCreateAccountCategory = (...args: Parameters<typeof Real.useCreateAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateAccountCategory(...args) : Real.useCreateAccountCategory(...args);
};

export const useUpdateAccountCategory = (...args: Parameters<typeof Real.useUpdateAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateAccountCategory(...args) : Real.useUpdateAccountCategory(...args);
};

export const useUpsertAccountCategory = (...args: Parameters<typeof Real.useUpsertAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertAccountCategory(...args) : Real.useUpsertAccountCategory(...args);
};

export const useDeleteAccountCategory = (...args: Parameters<typeof Real.useDeleteAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteAccountCategory(...args) : Real.useDeleteAccountCategory(...args);
};

export const useRestoreAccountCategory = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreAccountCategory() : Real.useRestoreAccountCategory();
};

// Export any other real hooks/helpers by default
export * from "./AccountCategories.Repository";
