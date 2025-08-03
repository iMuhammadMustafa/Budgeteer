import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/Accounts.supa";
import * as Mock from "./__mock__/Accounts.mock";

// Proxy pattern: swap to mock if demo mode is active, otherwise use real
export const getAllAccounts = (...args: Parameters<typeof Real.getAllAccounts>) => {
  return getDemoMode() ? Mock.getAllAccounts(...args) : Real.getAllAccounts(...args);
};

export const getAccountById = (...args: Parameters<typeof Real.getAccountById>) => {
  return getDemoMode() ? Mock.getAccountById(...args) : Real.getAccountById(...args);
};

export const createAccount = (...args: Parameters<typeof Real.createAccount>) => {
  return getDemoMode() ? Mock.createAccount(...args) : Real.createAccount(...args);
};

export const updateAccount = (...args: Parameters<typeof Real.updateAccount>) => {
  return getDemoMode() ? Mock.updateAccount(...args) : Real.updateAccount(...args);
};

export const deleteAccount = (...args: Parameters<typeof Real.deleteAccount>) => {
  return getDemoMode() ? Mock.deleteAccount(...args) : Real.deleteAccount(...args);
};

export const restoreAccount = (...args: Parameters<typeof Real.restoreAccount>) => {
  return getDemoMode() ? Mock.restoreAccount(...args) : Real.restoreAccount(...args);
};

export const updateAccountBalance = (...args: Parameters<typeof Real.updateAccountBalance>) => {
  return getDemoMode() ? Mock.updateAccountBalance(...args) : Real.updateAccountBalance(...args);
};

export const getAccountOpenedTransaction = (...args: Parameters<typeof Real.getAccountOpenedTransaction>) => {
  return getDemoMode() ? Mock.getAccountOpenedTransaction(...args) : Real.getAccountOpenedTransaction(...args);
};

export const getTotalAccountBalance = (...args: Parameters<typeof Real.getTotalAccountBalance>) => {
  return getDemoMode() ? Mock.getTotalAccountBalance(...args) : Real.getTotalAccountBalance(...args);
};
