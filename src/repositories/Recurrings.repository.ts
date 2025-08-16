import { getDemoMode } from "@/src/providers/DemoModeGlobal";
import * as Real from "./supabase/Recurrings.api.supa";
import * as Mock from "./__mock__/Recurrings.mock";

export const listRecurrings = (...args: Parameters<typeof Real.listRecurrings>) => {
  return getDemoMode() ? Mock.listRecurrings(...args) : Real.listRecurrings(...args);
};

export const getRecurringById = (...args: Parameters<typeof Real.getRecurringById>) => {
  return getDemoMode() ? Mock.getRecurringById(...args) : Real.getRecurringById(...args);
};

export const createRecurring = (...args: Parameters<typeof Real.createRecurring>) => {
  return getDemoMode() ? Mock.createRecurring(...args) : Real.createRecurring(...args);
};

export const updateRecurring = (...args: Parameters<typeof Real.updateRecurring>) => {
  return getDemoMode() ? Mock.updateRecurring(...args) : Real.updateRecurring(...args);
};

export const deleteRecurring = (...args: Parameters<typeof Real.deleteRecurring>) => {
  return getDemoMode() ? Mock.deleteRecurring(...args) : Real.deleteRecurring(...args);
};
