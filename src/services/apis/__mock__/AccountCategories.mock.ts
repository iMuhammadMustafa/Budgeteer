// Mock implementation of AccountCategories.api.ts for demo mode

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { accountCategories, validateReferentialIntegrity } from "./mockDataStore";
import { TableNames } from "@/src/types/db/TableNames";
import { IAccountCategoryProvider } from "@/src/types/storage/providers/IAccountCategoryProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";

export class MockAccountCategoryProvider implements IAccountCategoryProvider {
  readonly mode: StorageMode = StorageMode.Demo;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getAllAccountCategories(tenantId: string): Promise<AccountCategory[]> {
    return withStorageErrorHandling(
      async () => {
        return accountCategories
          .filter(cat => (cat.tenantid === tenantId || tenantId === "demo") && !cat.isdeleted)
          .sort((a, b) => {
            // Sort by display order (descending), then by name
            if (a.displayorder !== b.displayorder) {
              return b.displayorder - a.displayorder;
            }
            return a.name.localeCompare(b.name);
          });
      },
      {
        storageMode: "demo",
        operation: "getAllAccountCategories",
        table: "accountcategories",
        tenantId,
      },
    );
  }

  async getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory | null> {
    return withStorageErrorHandling(
      async () => {
        return (
          accountCategories.find(
            cat => cat.id === id && (cat.tenantid === tenantId || tenantId === "demo") && !cat.isdeleted,
          ) ?? null
        );
      },
      {
        storageMode: "demo",
        operation: "getAccountCategoryById",
        table: "accountcategories",
        recordId: id,
        tenantId,
      },
    );
  }

  async createAccountCategory(accountCategory: Inserts<TableNames.AccountCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate unique name constraint
        validateReferentialIntegrity.validateUniqueAccountCategoryName(
          accountCategory.name,
          accountCategory.tenantid || "demo",
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
      },
      {
        storageMode: "demo",
        operation: "createAccountCategory",
        table: "accountcategories",
        tenantId: accountCategory.tenantid,
      },
    );
  }

  async updateAccountCategory(accountCategory: Updates<TableNames.AccountCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = accountCategories.findIndex(cat => cat.id === accountCategory.id);
        if (idx === -1) throw new Error("Account category not found");

        // Validate unique name constraint if name is being updated
        if (accountCategory.name) {
          validateReferentialIntegrity.validateUniqueAccountCategoryName(
            accountCategory.name,
            accountCategories[idx].tenantid,
            accountCategory.id,
          );
        }

        accountCategories[idx] = {
          ...accountCategories[idx],
          ...accountCategory,
          updatedat: new Date().toISOString(),
        };
        return accountCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "updateAccountCategory",
        table: "accountcategories",
        recordId: accountCategory.id,
        tenantId: accountCategory.tenantid,
      },
    );
  }

  async deleteAccountCategory(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = accountCategories.findIndex(cat => cat.id === id);
        if (idx === -1) throw new Error("Account category not found");

        // Check referential integrity
        validateReferentialIntegrity.canDeleteAccountCategory(id);

        accountCategories[idx].isdeleted = true;
        accountCategories[idx].updatedby = userId ?? "demo";
        accountCategories[idx].updatedat = new Date().toISOString();

        return accountCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "deleteAccountCategory",
        table: "accountcategories",
        recordId: id,
      },
    );
  }

  async restoreAccountCategory(id: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = accountCategories.findIndex(cat => cat.id === id);
        if (idx === -1) throw new Error("Account category not found");

        accountCategories[idx].isdeleted = false;
        accountCategories[idx].updatedby = userId ?? "demo";
        accountCategories[idx].updatedat = new Date().toISOString();

        return accountCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "restoreAccountCategory",
        table: "accountcategories",
        recordId: id,
      },
    );
  }
}

// Export provider instance
export const mockAccountCategoryProvider = new MockAccountCategoryProvider();

// Legacy function exports for backward compatibility
export const getAllAccountCategories = (tenantId: string) =>
  mockAccountCategoryProvider.getAllAccountCategories(tenantId);
export const getAccountCategoryById = (id: string, tenantId: string) =>
  mockAccountCategoryProvider.getAccountCategoryById(id, tenantId);
export const createAccountCategory = (accountCategory: Inserts<TableNames.AccountCategories>) =>
  mockAccountCategoryProvider.createAccountCategory(accountCategory);
export const updateAccountCategory = (accountCategory: Updates<TableNames.AccountCategories>) =>
  mockAccountCategoryProvider.updateAccountCategory(accountCategory);
export const deleteAccountCategory = (id: string, userId?: string) =>
  mockAccountCategoryProvider.deleteAccountCategory(id, userId);
export const restoreAccountCategory = (id: string, userId?: string) =>
  mockAccountCategoryProvider.restoreAccountCategory(id, userId);
