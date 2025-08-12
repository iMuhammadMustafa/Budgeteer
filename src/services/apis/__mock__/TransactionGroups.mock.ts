// Mock implementation for TransactionGroups API

import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { transactionGroups, validateReferentialIntegrity } from "./mockDataStore";

export const getAllTransactionGroups = async (tenantId: string): Promise<TransactionGroup[]> => {
  return transactionGroups
    .filter(group => (group.tenantid === tenantId || tenantId === "demo") && !group.isdeleted)
    .sort((a, b) => {
      // Sort by display order (descending), then by name
      if (a.displayorder !== b.displayorder) {
        return b.displayorder - a.displayorder;
      }
      return a.name.localeCompare(b.name);
    });
};

export const getTransactionGroupById = async (id: string, tenantId: string): Promise<TransactionGroup | null> => {
  const group = transactionGroups.find(
    group => group.id === id && 
    (group.tenantid === tenantId || tenantId === "demo") && 
    !group.isdeleted
  );
  return group ? { ...group } : null;
};

export const createTransactionGroup = async (transactionGroup: Inserts<TableNames.TransactionGroups>) => {
  // Validate unique name constraint
  validateReferentialIntegrity.validateUniqueTransactionGroupName(
    transactionGroup.name,
    transactionGroup.tenantid || "demo"
  );

  const newGroup = {
    ...transactionGroup,
    id: `tg-${Date.now()}`,
    budgetamount: transactionGroup.budgetamount || 0,
    budgetfrequency: transactionGroup.budgetfrequency || "Monthly",
    color: transactionGroup.color || "#4CAF50",
    displayorder: transactionGroup.displayorder || 0,
    icon: transactionGroup.icon || "folder",
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: transactionGroup.createdby || "demo",
    updatedat: null,
    updatedby: null,
    tenantid: transactionGroup.tenantid || "demo",
    type: transactionGroup.type || "Expense",
  };
  
  transactionGroups.push(newGroup);
  return newGroup;
};

export const updateTransactionGroup = async (transactionGroup: Updates<TableNames.TransactionGroups>) => {
  const idx = transactionGroups.findIndex(group => group.id === transactionGroup.id);
  if (idx === -1) throw new Error("Transaction group not found");

  // Validate unique name constraint if name is being updated
  if (transactionGroup.name) {
    validateReferentialIntegrity.validateUniqueTransactionGroupName(
      transactionGroup.name,
      transactionGroups[idx].tenantid,
      transactionGroup.id
    );
  }

  transactionGroups[idx] = { 
    ...transactionGroups[idx], 
    ...transactionGroup,
    updatedat: new Date().toISOString(),
  };
  return transactionGroups[idx];
};

export const deleteTransactionGroup = async (id: string, userId: string) => {
  const idx = transactionGroups.findIndex(group => group.id === id);
  if (idx === -1) throw new Error("Transaction group not found");

  // Check referential integrity
  validateReferentialIntegrity.canDeleteTransactionGroup(id);

  transactionGroups[idx].isdeleted = true;
  transactionGroups[idx].updatedby = userId ?? "demo";
  transactionGroups[idx].updatedat = new Date().toISOString();
  
  return transactionGroups[idx];
};

export const restoreTransactionGroup = async (id: string, userId: string) => {
  const idx = transactionGroups.findIndex(group => group.id === id);
  if (idx === -1) throw new Error("Transaction group not found");
  
  transactionGroups[idx].isdeleted = false;
  transactionGroups[idx].updatedby = userId ?? "demo";
  transactionGroups[idx].updatedat = new Date().toISOString();
  
  return transactionGroups[idx];
};
