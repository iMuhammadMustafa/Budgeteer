import { Account } from "@/src/types/db/Tables.Types";
import { accounts, accountCategories } from "./mockDataStore";

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  return accounts
    .filter(acc => acc.tenantid === tenantId || tenantId === "demo")
    .map(acc => ({
      ...acc,
      category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
    }));
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  const acc = accounts.find(acc => acc.id === id && (acc.tenantid === tenantId || tenantId === "demo"));
  if (!acc) return null;
  return {
    ...acc,
    category: accountCategories.find(cat => cat.id === acc.categoryid) ?? null,
  };
};

export const createAccount = async (account: any) => {
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
  const idx = accounts.findIndex(a => a.id === account.id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx] = { ...accounts[idx], ...account };
  return accounts[idx];
};

export const deleteAccount = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx].isdeleted = true;
  accounts[idx].updatedby = userId ?? "demo";
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreAccount = async (id: string, userId?: string) => {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("Account not found");
  accounts[idx].isdeleted = false;
  accounts[idx].updatedby = userId ?? "demo";
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
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
