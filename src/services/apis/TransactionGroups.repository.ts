import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/TransactionGroups.supa";
import * as Mock from "./__mock__/TransactionGroups.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getAllTransactionGroups = (...args: Parameters<typeof Real.getAllTransactionGroups>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.getAllTransactionGroups(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAllTransactionGroups(...args) : Real.getAllTransactionGroups(...args);
  }
};

export const getTransactionGroupById = (...args: Parameters<typeof Real.getTransactionGroupById>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.getTransactionGroupById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getTransactionGroupById(...args) : Real.getTransactionGroupById(...args);
  }
};

export const createTransactionGroup = (...args: Parameters<typeof Real.createTransactionGroup>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.createTransactionGroup(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createTransactionGroup(...args) : Real.createTransactionGroup(...args);
  }
};

export const updateTransactionGroup = (...args: Parameters<typeof Real.updateTransactionGroup>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.updateTransactionGroup(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateTransactionGroup(...args) : Real.updateTransactionGroup(...args);
  }
};

export const deleteTransactionGroup = (...args: Parameters<typeof Real.deleteTransactionGroup>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.deleteTransactionGroup(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteTransactionGroup(...args) : Real.deleteTransactionGroup(...args);
  }
};

export const restoreTransactionGroup = (...args: Parameters<typeof Real.restoreTransactionGroup>) => {
  try {
    const repository = repositoryManager.getTransactionGroupRepository();
    return repository.restoreTransactionGroup(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreTransactionGroup(...args) : Real.restoreTransactionGroup(...args);
  }
};
