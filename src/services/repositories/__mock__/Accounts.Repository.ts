// Mock Accounts.Repository for demo mode

import { useQuery, useMutation } from "@tanstack/react-query";
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

let inMemoryAccounts = [...mockAccounts];

export const useGetAccounts = () => {
  return useQuery<Account[]>({
    queryKey: ["Accounts", "demo"],
    queryFn: async () => inMemoryAccounts,
    initialData: inMemoryAccounts,
  });
};

export const useGetTotalAccountBalance = () => {
  return useQuery<{ totalbalance: number } | null>({
    queryKey: ["Stats_TotalAccountBalance", "demo"],
    queryFn: async () => ({
      totalbalance: inMemoryAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    }),
    initialData: {
      totalbalance: inMemoryAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    },
  });
};

export const useGetAccountById = (id?: string) => {
  return useQuery<Account | undefined>({
    queryKey: ["Accounts", id, "demo"],
    queryFn: async () => inMemoryAccounts.find(acc => acc.id === id),
    enabled: !!id,
    initialData: () => inMemoryAccounts.find(acc => acc.id === id),
  });
};

export const useGetAccountOpenedTransaction = (id?: string) => {
  // Demo: just return a mock transaction object
  return useQuery<any>({
    queryKey: ["Transactions", id, "demo"],
    queryFn: async () =>
      id
        ? {
            id: "txn-1",
            accountid: id,
            amount: 100,
            date: "2025-01-01T10:00:00Z",
            type: "Initial",
          }
        : undefined,
    enabled: !!id,
    initialData: () =>
      id
        ? {
            id: "txn-1",
            accountid: id,
            amount: 100,
            date: "2025-01-01T10:00:00Z",
            type: "Initial",
          }
        : undefined,
  });
};

export const useCreateAccount = () => {
  return useMutation({
    mutationFn: async (account: Partial<Account>) => {
      const newAccount = {
        ...account,
        id: `acc-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryAccounts.length + 1,
        balance: account.balance ?? 0,
        currency: account.currency ?? "USD",
        icon: account.icon ?? "bank",
        color: account.color ?? "#2196F3",
        owner: "demo-user",
      } as Account;
      inMemoryAccounts = [...inMemoryAccounts, newAccount];
      return newAccount;
    },
  });
};

export const useUpdateAccount = () => {
  return useMutation({
    mutationFn: async ({ account }: { account: Partial<Account>; originalData: Account }) => {
      inMemoryAccounts = inMemoryAccounts.map(acc =>
        acc.id === account.id ? { ...acc, ...account, updatedat: new Date().toISOString() } : acc,
      );
      return inMemoryAccounts.find(acc => acc.id === account.id);
    },
  });
};

export const useUpsertAccount = () => {
  return useMutation({
    mutationFn: async ({
      formAccount,
      originalData,
    }: {
      formAccount: Partial<Account>;
      originalData?: Account;
      addAdjustmentTransaction?: boolean;
    }) => {
      if (formAccount.id && originalData) {
        inMemoryAccounts = inMemoryAccounts.map(acc =>
          acc.id === formAccount.id ? { ...acc, ...formAccount, updatedat: new Date().toISOString() } : acc,
        );
        return inMemoryAccounts.find(acc => acc.id === formAccount.id);
      }
      const newAccount = {
        ...formAccount,
        id: `acc-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryAccounts.length + 1,
        balance: formAccount.balance ?? 0,
        currency: formAccount.currency ?? "USD",
        icon: formAccount.icon ?? "bank",
        color: formAccount.color ?? "#2196F3",
        owner: "demo-user",
      } as Account;
      inMemoryAccounts = [...inMemoryAccounts, newAccount];
      return newAccount;
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryAccounts = inMemoryAccounts.map(acc =>
        acc.id === id ? { ...acc, isdeleted: true, updatedat: new Date().toISOString() } : acc,
      );
      return inMemoryAccounts.find(acc => acc.id === id);
    },
  });
};

export const useRestoreAccount = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryAccounts = inMemoryAccounts.map(acc =>
        acc.id === id ? { ...acc, isdeleted: false, updatedat: new Date().toISOString() } : acc,
      );
      return inMemoryAccounts.find(acc => acc.id === id);
    },
  });
};

export const useUpdateAccountOpenedTransaction = () => {
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      inMemoryAccounts = inMemoryAccounts.map(acc =>
        acc.id === id ? { ...acc, balance: amount, updatedat: new Date().toISOString() } : acc,
      );
      return inMemoryAccounts.find(acc => acc.id === id);
    },
  });
};
