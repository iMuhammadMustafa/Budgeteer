import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/AccountCategories.supa";
import * as Mock from "./__mock__/AccountCategories.mock";

// Proxy pattern: swap to mock if demo mode is active, otherwise use real
export const getAllAccountCategories = (...args: Parameters<typeof Real.getAllAccountCategories>) => {
  return getDemoMode() ? Mock.getAllAccountCategories(...args) : Real.getAllAccountCategories(...args);
};

export const getAccountCategoryById = (...args: Parameters<typeof Real.getAccountCategoryById>) => {
  return getDemoMode() ? Mock.getAccountCategoryById(...args) : Real.getAccountCategoryById(...args);
};

export const createAccountCategory = (...args: Parameters<typeof Real.createAccountCategory>) => {
  return getDemoMode() ? Mock.createAccountCategory(...args) : Real.createAccountCategory(...args);
};

export const updateAccountCategory = (...args: Parameters<typeof Real.updateAccountCategory>) => {
  return getDemoMode() ? Mock.updateAccountCategory(...args) : Real.updateAccountCategory(...args);
};

export const deleteAccountCategory = (...args: Parameters<typeof Real.deleteAccountCategory>) => {
  return getDemoMode() ? Mock.deleteAccountCategory(...args) : Real.deleteAccountCategory(...args);
};

export const restoreAccountCategory = (...args: Parameters<typeof Real.restoreAccountCategory>) => {
  return getDemoMode() ? Mock.restoreAccountCategory(...args) : Real.restoreAccountCategory(...args);
};
