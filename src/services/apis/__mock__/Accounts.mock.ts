import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { 
  accounts, 
  accountCategories, 
  transactions,
  validateReferentialIntegrity,
  mockDatabaseFunctions 
} from "./mockDataStore";

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
    })
    .map(acc => ({
      ...acc,
      category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
    }));
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  const acc = accounts.find(acc => 
    acc.id === id && 
    (acc.tenantid === tenantId || tenantId === "demo") && 
    !acc.isdeleted
  );
  if (!acc) return null;
  
  return {
    ...acc,
    category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
  };
};

export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  // Validate referential integrity
  validateReferentialIntegrity.validateAccountCategory(account.categoryid);
  validateReferentialIntegrity.validateUniqueAccountName(
    account.name, 
    account.tenantid || "demo"
  );

  const newAccount = {
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
    tenantid: account.tenantid || "demo",
  };
  
  accounts.push(newAccount);
  return newAccount;
};

export const updateAccount = async (account: Updates<TableNames.Accounts>) => {
  const idx = accounts.findIndex(a => a.id === account.id);
  if (idx === -1) throw new Error("Account not found");

  // Validate referential integrity if categoryid is being updated
  if (account.categoryid) {
    validateReferentialIntegrity.validateAccountCategory(account.categoryid);
  }

  // Validate unique name if name is being updated
  if (account.name) {
    validateReferentialIntegrity.validateUniqueAccountName(
      account.name,
      accounts[idx].tenantid,
      account.id
    );
  }

  accounts[idx] = { 
    ...accounts[idx], 
    ...account,
    updatedat: new Date().toISOString(),
  };
  return accounts[idx];
};

export const deleteAccount = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");

  // Check referential integrity
  validateReferentialIntegrity.canDeleteAccount(id);

  accounts[idx].isdeleted = true;
  accounts[idx].updatedby = userId ?? "demo";
  accounts[idx].updatedat = new Date().toISOString();
  
  return {
    ...accounts[idx],
    id,
    isdeleted: true,
    updatedby: userId ?? "demo",
  };
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
  
  if (!transaction) {
    throw new Error("Account opening transaction not found");
  }
  
  return {
    id: transaction.id,
    amount: transaction.amount,
  };
};

export const getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
  const total = accounts
    .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  return { totalbalance: total };
};
