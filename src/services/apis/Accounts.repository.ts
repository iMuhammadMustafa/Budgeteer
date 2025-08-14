import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/Accounts.supa";
import * as Mock from "./__mock__/Accounts.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

// Enhanced proxy pattern: uses dependency injection with fallback to legacy mode detection
// Maintains backward compatibility with existing getDemoMode() calls
export const getAllAccounts = (...args: Parameters<typeof Real.getAllAccounts>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.getAllAccounts(...args);
  } catch (error) {
    // Fallback to legacy proxy pattern
    return getDemoMode() ? Mock.getAllAccounts(...args) : Real.getAllAccounts(...args);
  }
};

export const getAccountById = (...args: Parameters<typeof Real.getAccountById>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.getAccountById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAccountById(...args) : Real.getAccountById(...args);
  }
};

export const createAccount = (...args: Parameters<typeof Real.createAccount>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.createAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createAccount(...args) : Real.createAccount(...args);
  }
};

export const updateAccount = (...args: Parameters<typeof Real.updateAccount>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.updateAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateAccount(...args) : Real.updateAccount(...args);
  }
};

export const deleteAccount = (...args: Parameters<typeof Real.deleteAccount>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.deleteAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteAccount(...args) : Real.deleteAccount(...args);
  }
};

export const restoreAccount = (...args: Parameters<typeof Real.restoreAccount>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.restoreAccount(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreAccount(...args) : Real.restoreAccount(...args);
  }
};

export const updateAccountBalance = (...args: Parameters<typeof Real.updateAccountBalance>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.updateAccountBalance(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateAccountBalance(...args) : Real.updateAccountBalance(...args);
  }
};

export const getAccountOpenedTransaction = (...args: Parameters<typeof Real.getAccountOpenedTransaction>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.getAccountOpenedTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAccountOpenedTransaction(...args) : Real.getAccountOpenedTransaction(...args);
  }
};

export const getTotalAccountBalance = (...args: Parameters<typeof Real.getTotalAccountBalance>) => {
  try {
    const repository = repositoryManager.getAccountRepository();
    return repository.getTotalAccountBalance(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTotalAccountBalance(...args) : Real.getTotalAccountBalance(...args);
  }
};
