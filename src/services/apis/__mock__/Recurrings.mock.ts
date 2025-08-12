// Mock implementation for Recurrings API

import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { recurrings, accounts, transactionCategories, validateReferentialIntegrity } from "./mockDataStore";

export type CreateRecurringDto = Inserts<TableNames.Recurrings>;
export type UpdateRecurringDto = Updates<TableNames.Recurrings>;

export const listRecurrings = async (params: { tenantId: string; filters?: any }): Promise<Recurring[]> => {
  let filtered = recurrings.filter(rec => 
    (rec.tenantid === params.tenantId || params.tenantId === "demo") && !rec.isdeleted
  );

  // Apply filters if provided
  if (params.filters) {
    if (params.filters.isactive !== undefined) {
      filtered = filtered.filter(rec => rec.isactive === params.filters.isactive);
    }
  }

  return filtered
    .sort((a, b) => {
      // Sort by next occurrence date, then by name
      if (a.nextoccurrencedate !== b.nextoccurrencedate) {
        return a.nextoccurrencedate.localeCompare(b.nextoccurrencedate);
      }
      return a.name.localeCompare(b.name);
    })
    .map(rec => ({
      ...rec,
      source_account: accounts.find(acc => acc.id === rec.sourceaccountid) ?? null,
      category: transactionCategories.find(cat => cat.id === rec.categoryid) ?? null,
    })) as unknown as Recurring[];
};

export const getRecurringById = async (id: string, tenantId: string): Promise<Recurring | null> => {
  const rec = recurrings.find(rec => 
    rec.id === id && 
    (rec.tenantid === tenantId || tenantId === "demo") && 
    !rec.isdeleted
  );
  
  if (!rec) return null;
  
  return {
    ...rec,
    source_account: accounts.find(acc => acc.id === rec.sourceaccountid) ?? null,
    category: transactionCategories.find(cat => cat.id === rec.categoryid) ?? null,
  } as unknown as Recurring;
};

export const createRecurring = async (recurringData: CreateRecurringDto, tenantId: string) => {
  // Validate referential integrity
  validateReferentialIntegrity.validateAccount(recurringData.sourceaccountid);
  if (recurringData.categoryid) {
    validateReferentialIntegrity.validateTransactionCategory(recurringData.categoryid);
  }

  const newRecurring = {
    ...recurringData,
    id: `rec-${Date.now()}`,
    tenantid: tenantId,
    amount: recurringData.amount || 0,
    currencycode: recurringData.currencycode || "USD",
    isactive: recurringData.isactive !== false, // Default to true
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: recurringData.createdby || "demo",
    updatedat: null,
    updatedby: null,
    type: recurringData.type || "Expense",
  };
  
  recurrings.push(newRecurring);
  return newRecurring;
};

export const updateRecurring = async (id: string, recurringData: UpdateRecurringDto, tenantId: string) => {
  const idx = recurrings.findIndex(rec => 
    rec.id === id && 
    (rec.tenantid === tenantId || tenantId === "demo")
  );
  if (idx === -1) throw new Error("Recurring not found");

  // Validate referential integrity if fields are being updated
  if (recurringData.sourceaccountid) {
    validateReferentialIntegrity.validateAccount(recurringData.sourceaccountid);
  }
  if (recurringData.categoryid) {
    validateReferentialIntegrity.validateTransactionCategory(recurringData.categoryid);
  }

  recurrings[idx] = {
    ...recurrings[idx],
    ...recurringData,
    updatedat: new Date().toISOString(),
  };
  
  return recurrings[idx];
};

export const deleteRecurring = async (id: string, tenantId: string, userId?: string) => {
  const idx = recurrings.findIndex(rec => 
    rec.id === id && 
    (rec.tenantid === tenantId || tenantId === "demo")
  );
  if (idx === -1) throw new Error("Recurring not found");
  
  recurrings[idx].isdeleted = true;
  recurrings[idx].updatedby = userId ?? "demo";
  recurrings[idx].updatedat = new Date().toISOString();
  
  return recurrings[idx];
};
