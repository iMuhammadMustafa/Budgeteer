import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/Recurrings.api.supa";
import * as Mock from "./__mock__/Recurrings.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const listRecurrings = (...args: Parameters<typeof Real.listRecurrings>) => {
  try {
    const repository = repositoryManager.getRecurringRepository();
    return repository.listRecurrings(...args);
  } catch (error) {
    return getDemoMode() ? Mock.listRecurrings(...args) : Real.listRecurrings(...args);
  }
};

export const getRecurringById = (...args: Parameters<typeof Real.getRecurringById>) => {
  try {
    const repository = repositoryManager.getRecurringRepository();
    return repository.getRecurringById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getRecurringById(...args) : Real.getRecurringById(...args);
  }
};

export const createRecurring = (...args: Parameters<typeof Real.createRecurring>) => {
  try {
    const repository = repositoryManager.getRecurringRepository();
    return repository.createRecurring(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createRecurring(...args) : Real.createRecurring(...args);
  }
};

export const updateRecurring = (...args: Parameters<typeof Real.updateRecurring>) => {
  try {
    const repository = repositoryManager.getRecurringRepository();
    return repository.updateRecurring(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateRecurring(...args) : Real.updateRecurring(...args);
  }
};

export const deleteRecurring = (...args: Parameters<typeof Real.deleteRecurring>) => {
  try {
    const repository = repositoryManager.getRecurringRepository();
    return repository.deleteRecurring(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteRecurring(...args) : Real.deleteRecurring(...args);
  }
};
