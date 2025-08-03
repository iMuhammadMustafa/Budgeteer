import { useDemoMode } from "@/src/providers/DemoModeProvider";
import * as Real from "./supabase/AccountCategories.supa";
import * as Mock from "./__mock__/AccountCategories.mock";

// Proxy pattern: swap to mock if demo mode is active, otherwise use real
export const getAllAccountCategories = (...args: Parameters<typeof Real.getAllAccountCategories>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.getAllAccountCategories(...args) : Real.getAllAccountCategories(...args);
};

export const getAccountCategoryById = (...args: Parameters<typeof Real.getAccountCategoryById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.getAccountCategoryById(...args) : Real.getAccountCategoryById(...args);
};

export const createAccountCategory = (...args: Parameters<typeof Real.createAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.createAccountCategory(...args) : Real.createAccountCategory(...args);
};

export const updateAccountCategory = (...args: Parameters<typeof Real.updateAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.updateAccountCategory(...args) : Real.updateAccountCategory(...args);
};

export const deleteAccountCategory = (...args: Parameters<typeof Real.deleteAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.deleteAccountCategory(...args) : Real.deleteAccountCategory(...args);
};

export const restoreAccountCategory = (...args: Parameters<typeof Real.restoreAccountCategory>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.restoreAccountCategory(...args) : Real.restoreAccountCategory(...args);
};
