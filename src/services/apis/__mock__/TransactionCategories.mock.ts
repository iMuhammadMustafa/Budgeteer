// Mock implementation for TransactionCategories API

import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { ITransactionCategoryProvider } from "@/src/types/storage/providers/ITransactionCategoryProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { transactionCategories, transactionGroups, validateReferentialIntegrity } from "./mockDataStore";
import { withStorageErrorHandling } from "../../storage/errors";

export class MockTransactionCategoryProvider implements ITransactionCategoryProvider {
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

  async getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]> {
    return withStorageErrorHandling(
      async () => {
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

            return (a.name || "").localeCompare(b.name || "");
          })
          .map(category => {
            const group = category.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;
            return {
              ...category,
              group: group || null,
            };
          });
      },
      {
        storageMode: "demo",
        operation: "getAllTransactionCategories",
        table: "transactioncategories",
        tenantId,
      },
    );
  }
  async getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory | null> {
    return withStorageErrorHandling(
      async () => {
        const cat = transactionCategories.find(
          category =>
            category.id === id && (category.tenantid === tenantId || tenantId === "demo") && !category.isdeleted,
        );
        return cat ? { ...cat } : null;
      },
      {
        storageMode: "demo",
        operation: "getTransactionCategoryById",
        table: "transactioncategories",
        recordId: id,
        tenantId,
      },
    );
  }

  async createTransactionCategory(transactionCategory: Inserts<TableNames.TransactionCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate referential integrity
        validateReferentialIntegrity.validateTransactionGroup(transactionCategory.groupid);
        validateReferentialIntegrity.validateUniqueTransactionCategoryName(
          transactionCategory.name || "",
          transactionCategory.tenantid,
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
          description: transactionCategory.description || null,
          tenantid: transactionCategory.tenantid || "demo",
          name: transactionCategory.name || null,
          groupid: transactionCategory.groupid,
        };

        transactionCategories.push(newCategory);
        return newCategory;
      },
      {
        storageMode: "demo",
        operation: "createTransactionCategory",
        table: "transactioncategories",
        tenantId: transactionCategory.tenantid,
      },
    );
  }

  async updateTransactionCategory(transactionCategory: Updates<TableNames.TransactionCategories>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
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
            transactionCategory.id,
          );
        }

        transactionCategories[idx] = {
          ...transactionCategories[idx],
          ...transactionCategory,
          updatedat: new Date().toISOString(),
        };
        return transactionCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "updateTransactionCategory",
        table: "transactioncategories",
        recordId: transactionCategory.id,
        tenantId: transactionCategories.find(cat => cat.id === transactionCategory.id)?.tenantid,
      },
    );
  }

  async deleteTransactionCategory(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = transactionCategories.findIndex(cat => cat.id === id);
        if (idx === -1) throw new Error("Transaction category not found");

        // Check referential integrity
        validateReferentialIntegrity.canDeleteTransactionCategory(id);

        transactionCategories[idx].isdeleted = true;
        transactionCategories[idx].updatedby = userId ?? "demo";
        transactionCategories[idx].updatedat = new Date().toISOString();

        return transactionCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "deleteTransactionCategory",
        table: "transactioncategories",
        recordId: id,
      },
    );
  }

  async restoreTransactionCategory(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = transactionCategories.findIndex(cat => cat.id === id);
        if (idx === -1) throw new Error("Transaction category not found");

        transactionCategories[idx].isdeleted = false;
        transactionCategories[idx].updatedby = userId ?? "demo";
        transactionCategories[idx].updatedat = new Date().toISOString();

        return transactionCategories[idx];
      },
      {
        storageMode: "demo",
        operation: "restoreTransactionCategory",
        table: "transactioncategories",
        recordId: id,
      },
    );
  }

  async getTransactionCategoriesByGroup(tenantId: string, groupId: string): Promise<TransactionCategory[]> {
    return withStorageErrorHandling(
      async () => {
        return transactionCategories
          .filter(
            cat => (cat.tenantid === tenantId || tenantId === "demo") && !cat.isdeleted && cat.groupid === groupId,
          )
          .sort((a, b) => {
            // Sort by display order (descending), then by name
            if (a.displayorder !== b.displayorder) {
              return b.displayorder - a.displayorder;
            }
            return (a.name || "").localeCompare(b.name || "");
          })
          .map(category => {
            const group = transactionGroups.find(g => g.id === category.groupid);
            return {
              ...category,
              group: group || null,
            };
          });
      },
      {
        storageMode: "demo",
        operation: "getTransactionCategoriesByGroup",
        table: "transactioncategories",
        tenantId,
      },
    );
  }
}

// Create and export an instance
export const mockTransactionCategoryProvider = new MockTransactionCategoryProvider();
