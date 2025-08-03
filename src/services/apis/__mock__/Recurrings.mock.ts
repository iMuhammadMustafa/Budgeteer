// Mock implementation for Recurrings API

import { CreateRecurringDto, UpdateRecurringDto } from "../supabase/Recurrings.api.supa";
import { recurrings } from "./mockDataStore";

export const listRecurrings = async (params: { tenantId: string; filters?: any }) => {
  return recurrings.filter(rec => rec.tenantid === params.tenantId || params.tenantId === "demo");
};

export const getRecurringById = async (id: string, tenantId: string) => {
  return recurrings.find(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const createRecurring = async (recurringData: CreateRecurringDto, tenantId: string) => {
  const newRecurring = {
    ...recurringData,
    id: `rec-${Date.now()}`,
    tenantid: tenantId,
    isdeleted: false,
    createdat: new Date().toISOString(),
    updatedat: null,
    updatedby: null,
  };
  recurrings.push(newRecurring);
  return newRecurring;
};

export const updateRecurring = async (id: string, recurringData: UpdateRecurringDto, tenantId: string) => {
  const idx = recurrings.findIndex(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
  if (idx === -1) throw new Error("Recurring not found");
  recurrings[idx] = { ...recurrings[idx], ...recurringData, updatedat: new Date().toISOString() };
  return recurrings[idx];
};

export const deleteRecurring = async (id: string, tenantId: string, userId?: string) => {
  const idx = recurrings.findIndex(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
  if (idx === -1) throw new Error("Recurring not found");
  recurrings[idx].isdeleted = true;
  recurrings[idx].updatedby = userId ?? "demo";
  recurrings[idx].updatedat = new Date().toISOString();
  return { id, tenantid: tenantId, isdeleted: true, updatedby: userId ?? "demo" };
};
