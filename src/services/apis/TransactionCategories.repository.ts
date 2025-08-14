import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/TransactionCategories.supa";
import * as Mock from "./__mock__/TransactionCategories.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getAllTransactionCategories = (...args: Parameters<typeof Real.getAllTransactionCategories>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.getAllTransactionCategories(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAllTransactionCategories(...args) : Real.getAllTransactionCategories(...args);
  }
};

export const getTransactionCategoryById = (...args: Parameters<typeof Real.getTransactionCategoryById>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.getTransactionCategoryById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionCategoryById(...args) : Real.getTransactionCategoryById(...args);
  }
};

export const createTransactionCategory = (...args: Parameters<typeof Real.createTransactionCategory>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.createTransactionCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createTransactionCategory(...args) : Real.createTransactionCategory(...args);
  }
};

export const updateTransactionCategory = (...args: Parameters<typeof Real.updateTransactionCategory>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.updateTransactionCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateTransactionCategory(...args) : Real.updateTransactionCategory(...args);
  }
};

export const deleteTransactionCategory = (...args: Parameters<typeof Real.deleteTransactionCategory>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.deleteTransactionCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteTransactionCategory(...args) : Real.deleteTransactionCategory(...args);
  }
};

export const restoreTransactionCategory = (...args: Parameters<typeof Real.restoreTransactionCategory>) => {
  try {
    const repository = repositoryManager.getTransactionCategoryRepository();
    return repository.restoreTransactionCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreTransactionCategory(...args) : Real.restoreTransactionCategory(...args);
  }
};
