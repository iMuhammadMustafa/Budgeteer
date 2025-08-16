// Mock implementation for TransactionCategories API

import { TransactionCategory } from "@/src/types/db/Tables.Types";
import { transactionCategories, transactions, transactionGroups } from "./mockDataStore";

export const getAllTransactionCategories = async (tenantId: string) => {
  return transactionCategories
    .filter(cat => cat.tenantid === tenantId || tenantId === "demo")
    .map(category => {
      const group = category.groupid ? transactionGroups.find((g: any) => g.id === category.groupid) : null;
      return {
        ...category,
        group: group ? { ...group } : { id: category.groupid, name: `Mock Group ${category.groupid?.split("-")[1]}` },
      };
    });
};

export const getTransactionCategoryById = async (id: string, tenantId: string) => {
  const cat = transactionCategories.find(
    category => category.id === id && (category.tenantid === tenantId || tenantId === "demo"),
  );
  return cat ? { ...cat } : null;
};

export const createTransactionCategory = async (transactionCategory: any) => {
  if (
    transactionCategories.some(
      cat => cat.name === transactionCategory.name && cat.tenantid === transactionCategory.tenantid && !cat.isdeleted,
    )
  ) {
    throw new Error("Transaction category name already exists");
  }
  const newCategory = {
    ...transactionCategory,
    id: `tc-${Date.now()}`,
    isdeleted: false,
    createdat: new Date().toISOString(),
    updatedat: null,
    updatedby: null,
  };
  transactionCategories.push(newCategory);
  return newCategory;
};

export const updateTransactionCategory = async (transactionCategory: any) => {
  const idx = transactionCategories.findIndex(cat => cat.id === transactionCategory.id);
  if (idx === -1) throw new Error("Transaction category not found");
  transactionCategories[idx] = { ...transactionCategories[idx], ...transactionCategory };
  return transactionCategories[idx];
};

export const deleteTransactionCategory = async (id: string, userId: string) => {
  // Prevent deletion if referenced by any transaction
  if (transactions.some(tr => tr.categoryid === id && !tr.isdeleted)) {
    throw new Error("Cannot delete: Category is referenced by transactions");
  }
  const idx = transactionCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Transaction category not found");
  transactionCategories[idx].isdeleted = true;
  transactionCategories[idx].updatedby = userId ?? "demo";
  transactionCategories[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreTransactionCategory = async (id: string, userId: string) => {
  const idx = transactionCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Transaction category not found");
  transactionCategories[idx].isdeleted = false;
  transactionCategories[idx].updatedby = userId ?? "demo";
  transactionCategories[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};
