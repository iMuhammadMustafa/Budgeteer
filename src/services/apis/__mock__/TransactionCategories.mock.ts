// Mock implementation for TransactionCategories API

import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { transactionCategories, transactionGroups, validateReferentialIntegrity } from "./mockDataStore";

export const getAllTransactionCategories = async (tenantId: string) => {
  return transactionCategories
    .filter(cat => (cat.tenantid === tenantId || tenantId === "demo") && !cat.isdeleted)
    .sort((a, b) => {
      // Sort by display order (descending), then by group display order (descending), then by name
      if (a.displayorder !== b.displayorder) {
        return b.displayorder - a.displayorder;
      }
      
      const groupA = transactionGroups.find(g => g.id === a.groupid);
      const groupB = transactionGroups.find(g => g.id === b.groupid);
      
      if (groupA && groupB && groupA.displayorder !== groupB.displayorder) {
        return groupB.displayorder - groupA.displayorder;
      }
      
      return (a.name || '').localeCompare(b.name || '');
    })
    .map(category => {
      const group = category.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;
      return {
        ...category,
        group: group || null,
      };
    });
};

export const getTransactionCategoryById = async (id: string, tenantId: string) => {
  const cat = transactionCategories.find(
    category => category.id === id && 
    (category.tenantid === tenantId || tenantId === "demo") && 
    !category.isdeleted
  );
  return cat ? { ...cat } : null;
};

export const createTransactionCategory = async (transactionCategory: Inserts<TableNames.TransactionCategories>) => {
  // Validate referential integrity
  validateReferentialIntegrity.validateTransactionGroup(transactionCategory.groupid);
  validateReferentialIntegrity.validateUniqueTransactionCategoryName(
    transactionCategory.name || '',
    transactionCategory.tenantid
  );

  const newCategory = {
    ...transactionCategory,
    id: `tc-${Date.now()}`,
    budgetamount: transactionCategory.budgetamount || 0,
    budgetfrequency: transactionCategory.budgetfrequency || "Monthly",
    color: transactionCategory.color || "#4CAF50",
    displayorder: transactionCategory.displayorder || 0,
    icon: transactionCategory.icon || "category",
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: transactionCategory.createdby || "demo",
    updatedat: null,
    updatedby: null,
    type: transactionCategory.type || "Expense",
  };
  
  transactionCategories.push(newCategory);
  return newCategory;
};

export const updateTransactionCategory = async (transactionCategory: Updates<TableNames.TransactionCategories>) => {
  const idx = transactionCategories.findIndex(cat => cat.id === transactionCategory.id);
  if (idx === -1) throw new Error("Transaction category not found");

  // Validate referential integrity if groupid is being updated
  if (transactionCategory.groupid) {
    validateReferentialIntegrity.validateTransactionGroup(transactionCategory.groupid);
  }

  // Validate unique name constraint if name is being updated
  if (transactionCategory.name) {
    validateReferentialIntegrity.validateUniqueTransactionCategoryName(
      transactionCategory.name,
      transactionCategories[idx].tenantid,
      transactionCategory.id
    );
  }

  transactionCategories[idx] = { 
    ...transactionCategories[idx], 
    ...transactionCategory,
    updatedat: new Date().toISOString(),
  };
  return transactionCategories[idx];
};

export const deleteTransactionCategory = async (id: string, userId: string) => {
  const idx = transactionCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Transaction category not found");

  // Check referential integrity
  validateReferentialIntegrity.canDeleteTransactionCategory(id);

  transactionCategories[idx].isdeleted = true;
  transactionCategories[idx].updatedby = userId ?? "demo";
  transactionCategories[idx].updatedat = new Date().toISOString();
  
  return transactionCategories[idx];
};

export const restoreTransactionCategory = async (id: string, userId: string) => {
  const idx = transactionCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Transaction category not found");
  
  transactionCategories[idx].isdeleted = false;
  transactionCategories[idx].updatedby = userId ?? "demo";
  transactionCategories[idx].updatedat = new Date().toISOString();
  
  return transactionCategories[idx];
};
