import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/Transactions.supa";
import * as Mock from "./__mock__/Transactions.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getAllTransactions = (...args: Parameters<typeof Real.getAllTransactions>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getAllTransactions(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAllTransactions(...args) : Real.getAllTransactions(...args);
  }
};

export const getTransactions = (...args: Parameters<typeof Real.getTransactions>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getTransactions(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactions(...args) : Real.getTransactions(...args);
  }
};

export const getTransactionFullyById = (...args: Parameters<typeof Real.getTransactionFullyById>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getTransactionFullyById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionFullyById(...args) : Real.getTransactionFullyById(...args);
  }
};

export const getTransactionById = (...args: Parameters<typeof Real.getTransactionById>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getTransactionById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionById(...args) : Real.getTransactionById(...args);
  }
};

export const getTransactionByTransferId = (...args: Parameters<typeof Real.getTransactionByTransferId>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getTransactionByTransferId(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionByTransferId(...args) : Real.getTransactionByTransferId(...args);
  }
};

export const getTransactionsByName = (...args: Parameters<typeof Real.getTransactionsByName>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.getTransactionsByName(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionsByName(...args) : Real.getTransactionsByName(...args);
  }
};

export const createTransaction = (...args: Parameters<typeof Real.createTransaction>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.createTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createTransaction(...args) : Real.createTransaction(...args);
  }
};

export const createTransactions = (...args: Parameters<typeof Real.createTransactions>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.createTransactions(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createTransactions(...args) : Real.createTransactions(...args);
  }
};

export const createMultipleTransactions = (...args: Parameters<typeof Real.createMultipleTransactions>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.createMultipleTransactions(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createMultipleTransactions(...args) : Real.createMultipleTransactions(...args);
  }
};

export const updateTransaction = (...args: Parameters<typeof Real.updateTransaction>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.updateTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateTransaction(...args) : Real.updateTransaction(...args);
  }
};

export const updateTransferTransaction = (...args: Parameters<typeof Real.updateTransferTransaction>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.updateTransferTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateTransferTransaction(...args) : Real.updateTransferTransaction(...args);
  }
};

export const deleteTransaction = (...args: Parameters<typeof Real.deleteTransaction>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.deleteTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteTransaction(...args) : Real.deleteTransaction(...args);
  }
};

export const restoreTransaction = (...args: Parameters<typeof Real.restoreTransaction>) => {
  try {
    const repository = repositoryManager.getTransactionRepository();
    return repository.restoreTransaction(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreTransaction(...args) : Real.restoreTransaction(...args);
  }
};
