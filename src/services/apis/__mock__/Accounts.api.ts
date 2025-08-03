// Mock implementation of Accounts.api.ts for demo mode

import { Account } from "@/src/types/db/Tables.Types";

// Example mock data
const mockAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Checking Account",
    balance: 2500.75,
    categoryid: "cat-1",
    color: "#4CAF50",
    icon: "bank",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Main checking account",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-2",
    name: "Credit Card",
    balance: -1200.0,
    categoryid: "cat-2",
    color: "#F44336",
    icon: "credit-card",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Visa credit card",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-3",
    name: "Savings Account",
    balance: 8000.0,
    categoryid: "cat-3",
    color: "#2196F3",
    icon: "piggy-bank",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Emergency savings",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-4",
    name: "Investment Account",
    balance: 15000.0,
    categoryid: "cat-4",
    color: "#9C27B0",
    icon: "trending-up",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Stocks and bonds",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-5",
    name: "Loan Account",
    balance: -5000.0,
    categoryid: "cat-5",
    color: "#FF9800",
    icon: "account-balance",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Personal loan",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-6",
    name: "Business Checking",
    balance: 12000.0,
    categoryid: "cat-1",
    color: "#388E3C",
    icon: "business",
    displayorder: 6,
    isdeleted: false,
    createdat: "2025-01-06T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Business account",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-7",
    name: "Travel Savings",
    balance: 3000.0,
    categoryid: "cat-3",
    color: "#1976D2",
    icon: "flight",
    displayorder: 7,
    isdeleted: false,
    createdat: "2025-01-07T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Vacation fund",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-8",
    name: "Mortgage",
    balance: -100000.0,
    categoryid: "cat-5",
    color: "#FFA726",
    icon: "home",
    displayorder: 8,
    isdeleted: false,
    createdat: "2025-01-08T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Home mortgage",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-9",
    name: "Retirement Fund",
    balance: 40000.0,
    categoryid: "cat-4",
    color: "#8E24AA",
    icon: "account-balance-wallet",
    displayorder: 9,
    isdeleted: false,
    createdat: "2025-01-09T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "401k retirement",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-10",
    name: "Petty Cash",
    balance: 200.0,
    categoryid: "cat-1",
    color: "#43A047",
    icon: "attach-money",
    displayorder: 10,
    isdeleted: false,
    createdat: "2025-01-10T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Office petty cash",
    notes: null,
    owner: "demo-user",
  },
];

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  return mockAccounts.filter(acc => acc.tenantid === tenantId || tenantId === "demo");
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  return mockAccounts.find(acc => acc.id === id && (acc.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const createAccount = async (account: any) => {
  return { ...account, id: String(Date.now()) };
};

export const updateAccount = async (account: any) => {
  return { ...account };
};

export const deleteAccount = async (id: string, userId?: string) => {
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreAccount = async (id: string, userId?: string) => {
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
  return { accountid, amount, status: "mocked" };
};

export const getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
  return { id: "txn1", amount: 100 };
};

export const getTotalAccountBalance = async (tenantId: string): Promise<{ totalbalance: number } | null> => {
  return { totalbalance: 1000 };
};
