import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/TransactionCategories.supa";
import * as Mock from "./__mock__/TransactionCategories.mock";

export const getAllTransactionCategories = (...args: Parameters<typeof Real.getAllTransactionCategories>) => {
  return getDemoMode() ? Mock.getAllTransactionCategories(...args) : Real.getAllTransactionCategories(...args);
};

export const getTransactionCategoryById = (...args: Parameters<typeof Real.getTransactionCategoryById>) => {
  return getDemoMode() ? Mock.getTransactionCategoryById(...args) : Real.getTransactionCategoryById(...args);
};

export const createTransactionCategory = (...args: Parameters<typeof Real.createTransactionCategory>) => {
  return getDemoMode() ? Mock.createTransactionCategory(...args) : Real.createTransactionCategory(...args);
};

export const updateTransactionCategory = (...args: Parameters<typeof Real.updateTransactionCategory>) => {
  return getDemoMode() ? Mock.updateTransactionCategory(...args) : Real.updateTransactionCategory(...args);
};

export const deleteTransactionCategory = (...args: Parameters<typeof Real.deleteTransactionCategory>) => {
  return getDemoMode() ? Mock.deleteTransactionCategory(...args) : Real.deleteTransactionCategory(...args);
};

export const restoreTransactionCategory = (...args: Parameters<typeof Real.restoreTransactionCategory>) => {
  return getDemoMode() ? Mock.restoreTransactionCategory(...args) : Real.restoreTransactionCategory(...args);
};
