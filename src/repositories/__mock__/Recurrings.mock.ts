// Mock implementation for Recurrings API

import { Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { recurrings, accounts, transactionCategories } from "./mockDataStore";

export const listRecurrings = async (params: { tenantId: string; filters?: any }) => {
  return recurrings
    .filter(rec => rec.tenantid === params.tenantId || params.tenantId === "demo")
    .map(rec => ({
      ...rec,
      source_account: accounts.find((acc: any) => acc.id === (rec as any).sourceaccountid) ?? null,
      category: transactionCategories.find((cat: any) => cat.id === (rec as any).categoryid) ?? null,
    }));
};

export const getRecurringById = async (id: string, tenantId: string) => {
  const rec = recurrings.find(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
  if (!rec) return null;
  return {
    ...rec,
    source_account: accounts.find((acc: any) => acc.id === (rec as any).sourceaccountid) ?? null,
    category: transactionCategories.find((cat: any) => cat.id === (rec as any).categoryid) ?? null,
  };
};

export const createRecurring = async (recurringData: Inserts<TableNames.Recurrings>, tenantId: string) => {
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

export const updateRecurring = async (id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string) => {
  const idx = recurrings.findIndex(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
  if (idx === -1) throw new Error("Recurring not found");
  recurrings[idx] = {
    ...recurrings[idx],
    ...recurringData,
    updatedat: new Date().toISOString(),
    isdeleted: false,
    createdat: recurrings[idx].createdat ?? new Date().toISOString(),
  };
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
