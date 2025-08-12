import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { StorageModeManager } from "../storage/StorageModeManager";
import * as Real from "./supabase/Accounts.supa";
import * as Mock from "./__mock__/Accounts.mock";

// Get the storage manager instance
const storageManager = StorageModeManager.getInstance();

// Enhanced proxy pattern: supports three modes with dependency injection
// Maintains backward compatibility with existing getDemoMode() calls
export const getAllAccounts = (...args: Parameters<typeof Real.getAllAccounts>) => {
  // Use new DI system if available, fallback to legacy mode detection
  try {
    const provider = storageManager.getAccountProvider();
    return provider.getAllAccounts(...args);
  } catch (error) {
    // Fallback to legacy proxy pattern
    return getDemoMode() ? Mock.getAllAccounts(...args) : Real.getAllAccounts(...args);
  }
};

export const getAccountById = (...args: Parameters<typeof Real.getAccountById>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.getAccountById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAccountById(...args) : Real.getAccountById(...args);
  }
};

export const createAccount = (...args: Parameters<typeof Real.createAccount>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.createAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createAccount(...args) : Real.createAccount(...args);
  }
};

export const updateAccount = (...args: Parameters<typeof Real.updateAccount>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.updateAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateAccount(...args) : Real.updateAccount(...args);
  }
};

export const deleteAccount = (...args: Parameters<typeof Real.deleteAccount>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.deleteAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteAccount(...args) : Real.deleteAccount(...args);
  }
};

export const restoreAccount = (...args: Parameters<typeof Real.restoreAccount>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.restoreAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreAccount(...args) : Real.restoreAccount(...args);
  }
};

export const updateAccountBalance = (...args: Parameters<typeof Real.updateAccountBalance>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.updateAccountBalance(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateAccountBalance(...args) : Real.updateAccountBalance(...args);
  }
};

export const getAccountOpenedTransaction = (...args: Parameters<typeof Real.getAccountOpenedTransaction>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.getAccountOpenedTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAccountOpenedTransaction(...args) : Real.getAccountOpenedTransaction(...args);
  }
};

export const getTotalAccountBalance = (...args: Parameters<typeof Real.getTotalAccountBalance>) => {
  try {
    const provider = storageManager.getAccountProvider();
    return provider.getTotalAccountBalance(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTotalAccountBalance(...args) : Real.getTotalAccountBalance(...args);
  }
};
