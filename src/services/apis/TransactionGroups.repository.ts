import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/TransactionGroups.supa";
import * as Mock from "./__mock__/TransactionGroups.mock";

export const getAllTransactionGroups = (...args: Parameters<typeof Real.getAllTransactionGroups>) => {
  return getDemoMode() ? Mock.getAllTransactionGroups(...args) : Real.getAllTransactionGroups(...args);
};

export const getTransactionGroupById = (...args: Parameters<typeof Real.getTransactionGroupById>) => {
  return getDemoMode() ? Mock.getTransactionGroupById(...args) : Real.getTransactionGroupById(...args);
};

export const createTransactionGroup = (...args: Parameters<typeof Real.createTransactionGroup>) => {
  return getDemoMode() ? Mock.createTransactionGroup(...args) : Real.createTransactionGroup(...args);
};

export const updateTransactionGroup = (...args: Parameters<typeof Real.updateTransactionGroup>) => {
  return getDemoMode() ? Mock.updateTransactionGroup(...args) : Real.updateTransactionGroup(...args);
};

export const deleteTransactionGroup = (...args: Parameters<typeof Real.deleteTransactionGroup>) => {
  return getDemoMode() ? Mock.deleteTransactionGroup(...args) : Real.deleteTransactionGroup(...args);
};

export const restoreTransactionGroup = (...args: Parameters<typeof Real.restoreTransactionGroup>) => {
  return getDemoMode() ? Mock.restoreTransactionGroup(...args) : Real.restoreTransactionGroup(...args);
};
