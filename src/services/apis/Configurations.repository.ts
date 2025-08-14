import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import { RepositoryManager } from "./repositories/RepositoryManager";
import * as Real from "./supabase/Configurations.supa";
import * as Mock from "./__mock__/Configurations.mock";

// Get the repository manager instance
const repositoryManager = RepositoryManager.getInstance();

export const getAllConfigurations = (...args: Parameters<typeof Real.getAllConfigurations>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.getAllConfigurations(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getAllConfigurations(...args) : Real.getAllConfigurations(...args);
  }
};

export const getConfigurationById = (...args: Parameters<typeof Real.getConfigurationById>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.getConfigurationById(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getConfigurationById(...args) : Real.getConfigurationById(...args);
  }
};

export const getConfiguration = (...args: Parameters<typeof Real.getConfiguration>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.getConfiguration(...args);
  } catch (error) {
    return getDemoMode() ? Mock.getConfiguration(...args) : Real.getConfiguration(...args);
  }
};

export const createConfiguration = (...args: Parameters<typeof Real.createConfiguration>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.createConfiguration(...args);
  } catch (error) {
    return getDemoMode() ? Mock.createConfiguration(...args) : Real.createConfiguration(...args);
  }
};

export const updateConfiguration = (...args: Parameters<typeof Real.updateConfiguration>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.updateConfiguration(...args);
  } catch (error) {
    return getDemoMode() ? Mock.updateConfiguration(...args) : Real.updateConfiguration(...args);
  }
};

export const deleteConfiguration = (...args: Parameters<typeof Real.deleteConfiguration>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.deleteConfiguration(...args);
  } catch (error) {
    return getDemoMode() ? Mock.deleteConfiguration(...args) : Real.deleteConfiguration(...args);
  }
};

export const restoreConfiguration = (...args: Parameters<typeof Real.restoreConfiguration>) => {
  try {
    const repository = repositoryManager.getConfigurationRepository();
    return repository.restoreConfiguration(...args);
  } catch (error) {
    return getDemoMode() ? Mock.restoreConfiguration(...args) : Real.restoreConfiguration(...args);
  }
};
