import { Account } from "@/src/types/db/Tables.Types";
import { accounts, accountCategories } from "./mockDataStore";

// Helper: simulate random error
function maybeThrowError(message: string) {
  if (Math.random() < 0.15) throw new Error(message);
}

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  return accounts.filter(acc => acc.tenantid === tenantId || tenantId === "demo");
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  return accounts.find(acc => acc.id === id && (acc.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const createAccount = async (account: any) => {
  maybeThrowError("Failed to create account (simulated error)");
  if (accounts.some(a => a.name === account.name && a.tenantid === account.tenantid)) {
    throw new Error("Account name already exists");
  }
  if (!accountCategories.some(cat => cat.id === account.categoryid)) {
    throw new Error("Category does not exist");
  }
  const newAccount = { ...account, id: `acc-${Date.now()}` };
  accounts.push(newAccount);
  return newAccount;
};

export const updateAccount = async (account: any) => {
  maybeThrowError("Failed to update account (simulated error)");
  const idx = accounts.findIndex(a => a.id === account.id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx] = { ...accounts[idx], ...account };
  return accounts[idx];
};

export const deleteAccount = async (id: string, userId?: string) => {
  maybeThrowError("Failed to delete account (simulated error)");
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx].isdeleted = true;
  accounts[idx].updatedby = userId ?? "demo";
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreAccount = async (id: string, userId?: string) => {
  maybeThrowError("Failed to restore account (simulated error)");
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx].isdeleted = false;
  accounts[idx].updatedby = userId ?? "demo";
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
  maybeThrowError("Failed to update account balance (simulated error)");
  const idx = accounts.findIndex(a => a.id === accountid);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx].balance += amount;
  return { accountid, amount, status: "mocked" };
};

export const getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
  return { id: "txn1", amount: 100 };
};

export const getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
  const total = accounts
    .filter(acc => acc.tenantid === tenantId || tenantId === "demo")
    .reduce((sum, acc) => sum + (acc.isdeleted ? 0 : acc.balance), 0);
  return { totalbalance: total };
};
