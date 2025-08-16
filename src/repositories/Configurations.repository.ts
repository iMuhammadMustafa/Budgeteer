import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/Configurations.supa";
import * as Mock from "./__mock__/Configurations.mock";

export const getAllConfigurations = (...args: Parameters<typeof Real.getAllConfigurations>) => {
  return getDemoMode() ? Mock.getAllConfigurations(...args) : Real.getAllConfigurations(...args);
};

export const getConfigurationById = (...args: Parameters<typeof Real.getConfigurationById>) => {
  return getDemoMode() ? Mock.getConfigurationById(...args) : Real.getConfigurationById(...args);
};

export const getConfiguration = (...args: Parameters<typeof Real.getConfiguration>) => {
  return getDemoMode() ? Mock.getConfiguration(...args) : Real.getConfiguration(...args);
};

export const createConfiguration = (...args: Parameters<typeof Real.createConfiguration>) => {
  return getDemoMode() ? Mock.createConfiguration(...args) : Real.createConfiguration(...args);
};

export const updateConfiguration = (...args: Parameters<typeof Real.updateConfiguration>) => {
  return getDemoMode() ? Mock.updateConfiguration(...args) : Real.updateConfiguration(...args);
};

export const deleteConfiguration = (...args: Parameters<typeof Real.deleteConfiguration>) => {
  return getDemoMode() ? Mock.deleteConfiguration(...args) : Real.deleteConfiguration(...args);
};

export const restoreConfiguration = (...args: Parameters<typeof Real.restoreConfiguration>) => {
  return getDemoMode() ? Mock.restoreConfiguration(...args) : Real.restoreConfiguration(...args);
};
