// Mock implementation of AccountCategories.api.ts for demo mode

import { Inserts, Updates } from "@/src/types/db/Tables.Types";
import { accountCategories, validateReferentialIntegrity } from "./mockDataStore";
import { TableNames } from "@/src/types/db/TableNames";

export const getAllAccountCategories = async (tenantId: string): Promise<Inserts<TableNames.AccountCategories>[]> => {
  return accountCategories
    .filter(cat => (cat.tenantid === tenantId || tenantId === "demo") && !cat.isdeleted)
    .sort((a, b) => {
      // Sort by display order (descending), then by name
      if (a.displayorder !== b.displayorder) {
        return b.displayorder - a.displayorder;
      }
      return a.name.localeCompare(b.name);
    });
};

export const getAccountCategoryById = async (
  id: string,
  tenantId: string,
): Promise<Inserts<TableNames.AccountCategories> | null> => {
  return accountCategories.find(cat => 
    cat.id === id && 
    (cat.tenantid === tenantId || tenantId === "demo") && 
    !cat.isdeleted
  ) ?? null;
};

export const createAccountCategory = async (
  accountCategory: Inserts<TableNames.AccountCategories>,
): Promise<Inserts<TableNames.AccountCategories>> => {
  // Validate unique name constraint
  validateReferentialIntegrity.validateUniqueAccountCategoryName(
    accountCategory.name,
    accountCategory.tenantid || "demo"
  );

  const newCategory = {
    ...accountCategory,
    id: `cat-${Date.now()}`,
    color: accountCategory.color || "#4CAF50",
    displayorder: accountCategory.displayorder || 0,
    icon: accountCategory.icon || "account-balance-wallet",
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: accountCategory.createdby || "demo",
    updatedat: null,
    updatedby: null,
    tenantid: accountCategory.tenantid || "demo",
    type: accountCategory.type || "Asset",
  };
  
  accountCategories.push(newCategory);
  return newCategory;
};

export const updateAccountCategory = async (
  accountCategory: Updates<TableNames.AccountCategories>,
): Promise<Inserts<TableNames.AccountCategories>> => {
  const idx = accountCategories.findIndex(cat => cat.id === accountCategory.id);
  if (idx === -1) throw new Error("Account category not found");

  // Validate unique name constraint if name is being updated
  if (accountCategory.name) {
    validateReferentialIntegrity.validateUniqueAccountCategoryName(
      accountCategory.name,
      accountCategories[idx].tenantid,
      accountCategory.id
    );
  }

  accountCategories[idx] = { 
    ...accountCategories[idx], 
    ...accountCategory,
    updatedat: new Date().toISOString(),
  };
  return accountCategories[idx];
};

export const deleteAccountCategory = async (
  id: string,
  userId: string,
): Promise<Inserts<TableNames.AccountCategories>> => {
  const idx = accountCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Account category not found");

  // Check referential integrity
  validateReferentialIntegrity.canDeleteAccountCategory(id);

  accountCategories[idx].isdeleted = true;
  accountCategories[idx].updatedby = userId ?? "demo";
  accountCategories[idx].updatedat = new Date().toISOString();
  
  return accountCategories[idx];
};

export const restoreAccountCategory = async (
  id: string,
  userId: string,
): Promise<Inserts<TableNames.AccountCategories>> => {
  const idx = accountCategories.findIndex(cat => cat.id === id);
  if (idx === -1) throw new Error("Account category not found");
  
  accountCategories[idx].isdeleted = false;
  accountCategories[idx].updatedby = userId ?? "demo";
  accountCategories[idx].updatedat = new Date().toISOString();
  
  return accountCategories[idx];
};
