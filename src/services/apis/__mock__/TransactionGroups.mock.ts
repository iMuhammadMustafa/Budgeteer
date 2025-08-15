// Mock implementation for TransactionGroups API

import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { ITransactionGroupProvider } from "@/src/types/storage/providers/ITransactionGroupProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { transactionGroups, validateReferentialIntegrity } from "./mockDataStore";
import { withStorageErrorHandling } from "../../storage/errors";

export class MockTransactionGroupProvider implements ITransactionGroupProvider {
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

  async getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]> {
    return withStorageErrorHandling(
      async () => {
        return transactionGroups
          .filter(group => (group.tenantid === tenantId || tenantId === "demo") && !group.isdeleted)
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
        operation: "getAllTransactionGroups",
        table: "transactiongroups",
        tenantId,
      },
    );
  }

  async getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup | null> {
    return withStorageErrorHandling(
      async () => {
        const group = transactionGroups.find(
          group => group.id === id && (group.tenantid === tenantId || tenantId === "demo") && !group.isdeleted,
        );
        return group ? { ...group } : null;
      },
      {
        storageMode: "demo",
        operation: "getTransactionGroupById",
        table: "transactiongroups",
        recordId: id,
        tenantId,
      },
    );
  }

  async createTransactionGroup(transactionGroup: Inserts<TableNames.TransactionGroups>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate unique name constraint
        validateReferentialIntegrity.validateUniqueTransactionGroupName(
          transactionGroup.name,
          transactionGroup.tenantid || "demo",
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
          description: transactionGroup.description || null,
          name: transactionGroup.name,
        };

        transactionGroups.push(newGroup);
        return newGroup;
      },
      {
        storageMode: "demo",
        operation: "createTransactionGroup",
        table: "transactiongroups",
        tenantId: transactionGroup.tenantid,
      },
    );
  }

  async updateTransactionGroup(transactionGroup: Updates<TableNames.TransactionGroups>): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = transactionGroups.findIndex(group => group.id === transactionGroup.id);
        if (idx === -1) throw new Error("Transaction group not found");

        // Validate unique name constraint if name is being updated
        if (transactionGroup.name) {
          validateReferentialIntegrity.validateUniqueTransactionGroupName(
            transactionGroup.name,
            transactionGroups[idx].tenantid,
            transactionGroup.id,
          );
        }

        transactionGroups[idx] = {
          ...transactionGroups[idx],
          ...transactionGroup,
          updatedat: new Date().toISOString(),
        };
        return transactionGroups[idx];
      },
      {
        storageMode: "demo",
        operation: "updateTransactionGroup",
        table: "transactiongroups",
        recordId: transactionGroup.id,
        tenantId: transactionGroups.find(group => group.id === transactionGroup.id)?.tenantid,
      },
    );
  }

  async deleteTransactionGroup(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = transactionGroups.findIndex(group => group.id === id);
        if (idx === -1) throw new Error("Transaction group not found");

        // Check referential integrity
        validateReferentialIntegrity.canDeleteTransactionGroup(id);

        transactionGroups[idx].isdeleted = true;
        transactionGroups[idx].updatedby = userId ?? "demo";
        transactionGroups[idx].updatedat = new Date().toISOString();

        return transactionGroups[idx];
      },
      {
        storageMode: "demo",
        operation: "deleteTransactionGroup",
        table: "transactiongroups",
        recordId: id,
      },
    );
  }

  async restoreTransactionGroup(id: string, userId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const idx = transactionGroups.findIndex(group => group.id === id);
        if (idx === -1) throw new Error("Transaction group not found");

        transactionGroups[idx].isdeleted = false;
        transactionGroups[idx].updatedby = userId ?? "demo";
        transactionGroups[idx].updatedat = new Date().toISOString();

        return transactionGroups[idx];
      },
      {
        storageMode: "demo",
        operation: "restoreTransactionGroup",
        table: "transactiongroups",
        recordId: id,
      },
    );
  }
}

// Create and export an instance
export const mockTransactionGroupProvider = new MockTransactionGroupProvider();
