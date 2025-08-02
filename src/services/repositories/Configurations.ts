import * as Real from "./Configurations.Repository";
import * as Mock from "./__mock__/Configurations.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, else use real
export const useGetConfigurations = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetConfigurations() : Real.useGetConfigurations();
};

export const useGetConfigurationById = (...args: Parameters<typeof Real.useGetConfigurationById>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetConfigurationById(...args) : Real.useGetConfigurationById(...args);
};

export const useCreateConfiguration = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateConfiguration() : Real.useCreateConfiguration();
};

export const useUpdateConfiguration = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateConfiguration() : Real.useUpdateConfiguration();
};

export const useUpsertConfiguration = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpsertConfiguration() : Real.useUpsertConfiguration();
};

export const useDeleteConfiguration = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteConfiguration() : Real.useDeleteConfiguration();
};

export const useRestoreConfiguration = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useRestoreConfiguration() : Real.useRestoreConfiguration();
};
