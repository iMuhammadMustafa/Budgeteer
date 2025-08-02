import * as Real from "./Recurrings.Repository";
import * as Mock from "./__mock__/Recurrings.Repository";
import { useDemoMode } from "@/src/providers/DemoModeProvider";

// Proxy hooks: swap to mock if demo mode is active, else use real
export const useListRecurrings = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useListRecurrings() : Real.useListRecurrings();
};

export const useGetRecurring = (...args: Parameters<typeof Real.useGetRecurring>) => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useGetRecurring(...args) : Real.useGetRecurring(...args);
};

export const useCreateRecurring = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useCreateRecurring() : Real.useCreateRecurring();
};

export const useUpdateRecurring = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useUpdateRecurring() : Real.useUpdateRecurring();
};

export const useDeleteRecurring = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useDeleteRecurring() : Real.useDeleteRecurring();
};

export const useExecuteRecurringAction = () => {
  const { isDemo } = useDemoMode();
  return isDemo ? Mock.useExecuteRecurringAction() : Real.useExecuteRecurringAction();
};
