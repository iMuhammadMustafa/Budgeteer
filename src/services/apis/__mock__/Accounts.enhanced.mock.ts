/**
 * Enhanced Accounts Mock Implementation with Referential Integrity Validation
 * 
 * This is an example of how to integrate the new validation system
 * into existing mock implementations.
 */

import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { 
  accounts, 
  accountCategories, 
  transactions,
  validateReferentialIntegrity,
  mockDatabaseFunctions 
} from "./mockDataStore";

// Import the new validation system
import { ValidationHelpers, ValidationErrorHandler } from "../validation";

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  return accounts
    .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
    .sort((a, b) => {
      // Sort by category display order (descending), then by account display order (descending), then by name
      const catA = accountCategories.find(cat => cat.id === a.categoryid);
      const catB = accountCategories.find(cat => cat.id === b.categoryid);
      
      if (catA && catB && catA.displayorder !== catB.displayorder) {
        return catB.displayorder - catA.displayorder;
      }
      if (a.displayorder !== b.displayorder) {
        return b.displayorder - a.displayorder;
      }
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return (a.owner || '').localeCompare(b.owner || '');
    });
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  const acc = accounts.find(acc => 
    acc.id === id && 
    (acc.tenantid === tenantId || tenantId === "demo") && 
    !acc.isdeleted
  );
  return acc || null;
};

export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  const tenantId = account.tenantid || "demo";
  
  try {
    // Use new validation system
    await ValidationHelpers.validateBeforeCreate('accounts', account, tenantId);
    
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}`,
      balance: account.balance || 0,
      color: account.color || "#4CAF50",
      currency: account.currency || "USD",
      displayorder: account.displayorder || 0,
      icon: account.icon || "account-balance-wallet",
      isdeleted: false,
      createdat: new Date().toISOString(),
      createdby: account.createdby || "demo",
      updatedat: null,
      updatedby: null,
      tenantid: tenantId,
      description: account.description || null,
      notes: account.notes || null,
      owner: account.owner || null,
    };
    
    accounts.push(newAccount);
    return newAccount;
    
  } catch (error) {
    // Enhanced error handling
    if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
      throw new Error(`Invalid category reference: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
    } else if (ValidationErrorHandler.isConstraintViolationError(error)) {
      throw new Error(`Account name already exists: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
    }
    throw error;
  }
};

export const updateAccount = async (account: Updates<TableNames.Accounts>) => {
  const idx = accounts.findIndex(a => a.id === account.id);
  if (idx === -1) throw new Error("Account not found");

  const existingAccount = accounts[idx];
  const tenantId = existingAccount.tenantid;

  try {
    // Use new validation system
    await ValidationHelpers.validateBeforeUpdate('accounts', account, account.id!, tenantId);

    const updatedAccount = { 
      ...existingAccount, 
      ...account,
      updatedat: new Date().toISOString(),
    };
    
    accounts[idx] = updatedAccount;
    return updatedAccount;
    
  } catch (error) {
    // Enhanced error handling
    if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
      throw new Error(`Invalid reference: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
    } else if (ValidationErrorHandler.isConstraintViolationError(error)) {
      throw new Error(`Update failed: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
    }
    throw error;
  }
};

export const deleteAccount = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");

  const existingAccount = accounts[idx];
  const tenantId = existingAccount.tenantid;

  try {
    // Use new validation system to check cascade delete
    await ValidationHelpers.validateBeforeDelete('accounts', id, tenantId);

    accounts[idx].isdeleted = true;
    accounts[idx].updatedby = userId ?? "demo";
    accounts[idx].updatedat = new Date().toISOString();
    
    return {
      ...accounts[idx],
      id,
      isdeleted: true,
      updatedby: userId ?? "demo",
    };
    
  } catch (error) {
    // Enhanced error handling with cascade delete information
    if (ValidationErrorHandler.isCascadeDeleteError(error)) {
      throw new Error(`Cannot delete account: ${ValidationErrorHandler.getUserFriendlyMessage(error)}`);
    }
    throw error;
  }
};

export const deleteAccountWithCascade = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");

  const existingAccount = accounts[idx];
  const tenantId = existingAccount.tenantid;

  try {
    // Get cascade delete preview first
    const preview = await ValidationHelpers.getCascadeDeletePreview('accounts', id, tenantId);
    
    // Perform cascade delete
    const result = await ValidationHelpers.performCascadeDelete('accounts', id, tenantId, {
      softDelete: true,
      cascade: true,
      userId: userId
    });

    if (!result.success) {
      throw new Error(`Cascade delete failed: ${result.errors.join(', ')}`);
    }

    // Apply the delete operations to the mock data
    for (const operation of result.operations) {
      if (operation.table === 'accounts') {
        const accountIdx = accounts.findIndex(a => a.id === operation.id);
        if (accountIdx !== -1) {
          accounts[accountIdx].isdeleted = true;
          accounts[accountIdx].updatedby = userId ?? "demo";
          accounts[accountIdx].updatedat = new Date().toISOString();
        }
      } else if (operation.table === 'transactions') {
        const transactionIdx = transactions.findIndex(t => t.id === operation.id);
        if (transactionIdx !== -1) {
          transactions[transactionIdx].isdeleted = true;
          transactions[transactionIdx].updatedby = userId ?? "demo";
          transactions[transactionIdx].updatedat = new Date().toISOString();
        }
      }
      // Handle other dependent tables as needed
    }

    return {
      deletedAccount: accounts[idx],
      cascadeOperations: result.operations,
      preview: preview
    };
    
  } catch (error) {
    throw error;
  }
};

export const restoreAccount = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");
  
  accounts[idx].isdeleted = false;
  accounts[idx].updatedby = userId ?? "demo";
  accounts[idx].updatedat = new Date().toISOString();
  
  return {
    ...accounts[idx],
    id,
    isdeleted: false,
    updatedby: userId ?? "demo",
  };
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
  try {
    const newBalance = mockDatabaseFunctions.updateAccountBalance(accountid, amount);
    return { data: newBalance, error: null };
  } catch (error) {
    throw error;
  }
};

export const getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
  const transaction = transactions.find(tr => 
    tr.accountid === accountid && 
    (tr.tenantid === tenantId || tenantId === "demo") &&
    tr.type === "Initial" &&
    !tr.isdeleted
  );
  return transaction || null;
};

export const getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
  const accountList = await getAllAccounts(tenantId);
  const totalBalance = accountList.reduce((sum, account) => sum + account.balance, 0);
  return { totalbalance: totalBalance };
};

// Additional validation utilities specific to accounts
export const validateAccountDeletion = async (accountId: string, tenantId: string) => {
  const { canDelete, blockers } = await ValidationHelpers.canDeleteSafely('accounts', accountId, tenantId);
  
  return {
    canDelete,
    blockers,
    message: canDelete 
      ? 'Account can be safely deleted' 
      : `Cannot delete account: ${blockers.map(b => `${b.count} ${b.table}`).join(', ')}`
  };
};

export const getAccountDependencies = async (accountId: string, tenantId: string) => {
  const preview = await ValidationHelpers.getCascadeDeletePreview('accounts', accountId, tenantId);
  
  return {
    dependencies: preview.filter(item => item.table !== 'accounts'),
    totalDependencies: preview.length - 1, // Exclude the account itself
    wouldDelete: preview
  };
};