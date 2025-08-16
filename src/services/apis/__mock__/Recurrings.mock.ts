// Mock implementation for Recurrings API

import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { IRecurringProvider } from "@/src/types/storage/providers/IRecurringProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";
import { recurrings, validateReferentialIntegrity } from "./mockDataStore";

// Define the parameter types used in the actual implementation
type ListRecurringsParams = {
  tenantId: string;
  filters?: any;
};

export class MockRecurringProvider implements IRecurringProvider {
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

  async listRecurrings(params: ListRecurringsParams): Promise<Recurring[]> {
    return withStorageErrorHandling(
      async () => {
        let filtered = recurrings.filter(
          rec => (rec.tenantid === params.tenantId || params.tenantId === "demo") && !rec.isdeleted,
        );

        // Apply filters if provided
        if (params.filters) {
          if (params.filters.isactive !== undefined) {
            filtered = filtered.filter(rec => rec.isactive === params.filters.isactive);
          }
          if (params.filters.sourceaccountid) {
            filtered = filtered.filter(rec => rec.sourceaccountid === params.filters.sourceaccountid);
          }
          if (params.filters.categoryid) {
            filtered = filtered.filter(rec => rec.categoryid === params.filters.categoryid);
          }
        }

        // Sort by next occurrence date and name
        return filtered.sort((a, b) => {
          const dateA = new Date(a.nextoccurrencedate || "").getTime() || 0;
          const dateB = new Date(b.nextoccurrencedate || "").getTime() || 0;
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          return (a.name || "").localeCompare(b.name || "");
        });
      },
      {
        storageMode: "demo",
        operation: "listRecurrings",
        table: "recurrings",
        tenantId: params.tenantId,
      },
    );
  }

  async getRecurringById(id: string, tenantId: string): Promise<Recurring | null> {
    return withStorageErrorHandling(
      async () => {
        const recurring = recurrings.find(
          rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo") && !rec.isdeleted,
        );
        return recurring ?? null;
      },
      {
        storageMode: "demo",
        operation: "getRecurringById",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }

  async createRecurring(recurringData: Inserts<TableNames.Recurrings>, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        // Validate referential integrity
        validateReferentialIntegrity.validateAccount(recurringData.sourceaccountid);
        if (recurringData.categoryid) {
          validateReferentialIntegrity.validateTransactionCategory(recurringData.categoryid);
        }

        const newRecurring = {
          ...recurringData,
          id: recurringData.id || `rec-${Date.now()}`, // Use provided ID or generate one
          isdeleted: false,
          createdat: new Date().toISOString(),
          createdby: recurringData.createdby || "demo",
          updatedat: null,
          updatedby: null,
          tenantid: tenantId,
          isactive: recurringData.isactive ?? true,
          amount: recurringData.amount ?? 0,
          categoryid: recurringData.categoryid ?? null,
          description: recurringData.description ?? null,
          enddate: recurringData.enddate ?? null,
          notes: recurringData.notes ?? null,
          currencycode: recurringData.currencycode ?? "USD",
          recurrencerule: recurringData.recurrencerule,
          nextoccurrencedate: recurringData.nextoccurrencedate,
          name: recurringData.name,
          sourceaccountid: recurringData.sourceaccountid,
          type: recurringData.type ?? "Expense",
          payeename: recurringData.payeename ?? null,
          lastexecutedat: recurringData.lastexecutedat ?? null,
        };

        recurrings.push(newRecurring);
        return newRecurring;
      },
      {
        storageMode: "demo",
        operation: "createRecurring",
        table: "recurrings",
        tenantId,
      },
    );
  }

  async updateRecurring(id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = recurrings.findIndex(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
        if (index === -1) {
          throw new Error("Recurring transaction not found");
        }

        // Validate referential integrity if fields are being updated
        if (recurringData.sourceaccountid) {
          validateReferentialIntegrity.validateAccount(recurringData.sourceaccountid);
        }
        if (recurringData.categoryid) {
          validateReferentialIntegrity.validateTransactionCategory(recurringData.categoryid);
        }

        recurrings[index] = {
          ...recurrings[index],
          ...recurringData,
          updatedat: new Date().toISOString(),
          tenantid: tenantId, // Ensure tenant ID is preserved
        };

        return recurrings[index];
      },
      {
        storageMode: "demo",
        operation: "updateRecurring",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }

  async deleteRecurring(id: string, tenantId: string, userId?: string): Promise<any> {
    return withStorageErrorHandling(
      async () => {
        const index = recurrings.findIndex(rec => rec.id === id && (rec.tenantid === tenantId || tenantId === "demo"));
        if (index === -1) {
          throw new Error("Recurring transaction not found");
        }

        recurrings[index].isdeleted = true;
        recurrings[index].updatedby = userId ?? "demo";
        recurrings[index].updatedat = new Date().toISOString();

        return recurrings[index];
      },
      {
        storageMode: "demo",
        operation: "deleteRecurring",
        table: "recurrings",
        recordId: id,
        tenantId,
      },
    );
  }
}

// Export provider instance
export const mockRecurringProvider = new MockRecurringProvider();

// Legacy function exports for backward compatibility
export const listRecurrings = (params: ListRecurringsParams) => mockRecurringProvider.listRecurrings(params);
export const getRecurringById = (id: string, tenantId: string) => mockRecurringProvider.getRecurringById(id, tenantId);
export const createRecurring = (recurringData: Inserts<TableNames.Recurrings>, tenantId: string) =>
  mockRecurringProvider.createRecurring(recurringData, tenantId);
export const updateRecurring = (id: string, recurringData: Updates<TableNames.Recurrings>, tenantId: string) =>
  mockRecurringProvider.updateRecurring(id, recurringData, tenantId);
export const deleteRecurring = (id: string, tenantId: string, userId?: string) =>
  mockRecurringProvider.deleteRecurring(id, tenantId, userId);
