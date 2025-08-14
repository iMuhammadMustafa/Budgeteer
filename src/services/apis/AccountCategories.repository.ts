import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/AccountCategories.supa";
import * as Mock from "./__mock__/AccountCategories.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getAllAccountCategories = (...args: Parameters<typeof Real.getAllAccountCategories>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.getAllAccountCategories(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAllAccountCategories(...args) : Real.getAllAccountCategories(...args);
  }
};

export const getAccountCategoryById = (...args: Parameters<typeof Real.getAccountCategoryById>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.getAccountCategoryById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAccountCategoryById(...args) : Real.getAccountCategoryById(...args);
  }
};

export const createAccountCategory = (...args: Parameters<typeof Real.createAccountCategory>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.createAccountCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createAccountCategory(...args) : Real.createAccountCategory(...args);
  }
};

export const updateAccountCategory = (...args: Parameters<typeof Real.updateAccountCategory>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.updateAccountCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateAccountCategory(...args) : Real.updateAccountCategory(...args);
  }
};

export const deleteAccountCategory = (...args: Parameters<typeof Real.deleteAccountCategory>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.deleteAccountCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteAccountCategory(...args) : Real.deleteAccountCategory(...args);
  }
};

export const restoreAccountCategory = (...args: Parameters<typeof Real.restoreAccountCategory>) => {
  try {
    const repository = repositoryManager.getAccountCategoryRepository();
    return repository.restoreAccountCategory(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreAccountCategory(...args) : Real.restoreAccountCategory(...args);
  }
};
