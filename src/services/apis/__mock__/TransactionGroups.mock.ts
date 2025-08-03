// Mock implementation for TransactionGroups API

import { TransactionGroup } from "@/src/types/db/Tables.Types";
import { transactionGroups, transactionCategories } from "./mockDataStore";

export const getAllTransactionGroups = async (tenantId: string) => {
  return transactionGroups
    .filter(group => group.tenantid === tenantId || tenantId === "demo")
    .map(group => ({ ...group }));
};

export const getTransactionGroupById = async (id: string, tenantId: string) => {
  const group = transactionGroups.find(
    group => group.id === id && (group.tenantid === tenantId || tenantId === "demo"),
  );
  return group ? { ...group } : null;
};

export const createTransactionGroup = async (transactionGroup: any) => {
  if (
    transactionGroups.some(
      group => group.name === transactionGroup.name && group.tenantid === transactionGroup.tenantid && !group.isdeleted,
    )
  ) {
    throw new Error("Transaction group name already exists");
  }
  const newGroup = {
    ...transactionGroup,
    id: `tg-${Date.now()}`,
    isdeleted: false,
    createdat: new Date().toISOString(),
    updatedat: null,
    updatedby: null,
  };
  transactionGroups.push(newGroup);
  return newGroup;
};

export const updateTransactionGroup = async (transactionGroup: any) => {
  const idx = transactionGroups.findIndex(group => group.id === transactionGroup.id);
  if (idx === -1) throw new Error("Transaction group not found");
  transactionGroups[idx] = { ...transactionGroups[idx], ...transactionGroup };
  return transactionGroups[idx];
};

export const deleteTransactionGroup = async (id: string, userId: string) => {
  // Prevent deletion if referenced by any transaction category
  if (transactionCategories.some(cat => cat.groupid === id && !cat.isdeleted)) {
    throw new Error("Cannot delete: Group is referenced by transaction categories");
  }
  const idx = transactionGroups.findIndex(group => group.id === id);
  if (idx === -1) throw new Error("Transaction group not found");
  transactionGroups[idx].isdeleted = true;
  transactionGroups[idx].updatedby = userId ?? "demo";
  transactionGroups[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreTransactionGroup = async (id: string, userId: string) => {
  const idx = transactionGroups.findIndex(group => group.id === id);
  if (idx === -1) throw new Error("Transaction group not found");
  transactionGroups[idx].isdeleted = false;
  transactionGroups[idx].updatedby = userId ?? "demo";
  transactionGroups[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};
