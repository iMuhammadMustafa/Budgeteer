// Mock implementation of AccountCategories.api.ts for demo mode

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { accountCategories, accounts } from "./mockDataStore";

export const getAllAccountCategories = async (tenantId: string) => {
  return accountCategories.filter(cat => cat.tenantid === tenantId || tenantId === "demo");
};

export const getAccountCategoryById = async (id: string, tenantId: string) => {
  return accountCategories.find(cat => cat.id === id && (cat.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const createAccountCategory = async (accountCategory: Inserts<any>) => {
  if (
    accountCategories.some(
      cat => cat.name === accountCategory.name && cat.tenantid === accountCategory.tenantid && !cat.isdeleted,
    )
  ) {
    throw new Error("Account category name already exists");
  }
  const newCategory = {
    ...accountCategory,
    id: `cat-${Date.now()}`,
    isdeleted: false,
    createdat: new Date().toISOString(),
    updatedat: null,
    updatedby: null,
  };
  accountCategories.push(newCategory);
  return newCategory;
};

export const updateAccountCategory = async (accountCategory: Updates<any>) => {
  const idx = accountCategories.findIndex(cat => cat.id === accountCategory.id);
  if (idx === -1) throw new Error("Account category not found");
  accountCategories[idx] = { ...accountCategories[idx], ...accountCategory };
  return accountCategories[idx];
};

export const deleteAccountCategory = async (id: string, userId: string) => {
  // Prevent deletion if referenced by any account
  if (accounts.some(acc => acc.categoryid === id && !acc.isdeleted)) {
    throw new Error("Cannot delete: Category is referenced by accounts");
  }
  const idx = accountCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Account category not found");
  accountCategories[idx].isdeleted = true;
  accountCategories[idx].updatedby = userId ?? "demo";
  accountCategories[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreAccountCategory = async (id: string, userId: string) => {
  const idx = accountCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Account category not found");
  accountCategories[idx].isdeleted = false;
  accountCategories[idx].updatedby = userId ?? "demo";
  accountCategories[idx].updatedat = new Date().toISOString();
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};
