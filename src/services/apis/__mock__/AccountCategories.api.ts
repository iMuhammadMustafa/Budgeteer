// Mock implementation of AccountCategories.api.ts for demo mode

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";

// Example mock data
const mockCategories: AccountCategory[] = [
  {
    id: "cat-1",
    name: "Cash",
    color: "#4CAF50",
    icon: "cash",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-2",
    name: "Credit Card",
    color: "#F44336",
    icon: "credit-card",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Liability",
  },
  {
    id: "cat-3",
    name: "Savings",
    color: "#2196F3",
    icon: "piggy-bank",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-4",
    name: "Investments",
    color: "#9C27B0",
    icon: "trending-up",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-5",
    name: "Loans",
    color: "#FF9800",
    icon: "account-balance",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Liability",
  },
];

export const getAllAccountCategories = async (tenantId: string) => {
  return mockCategories.filter(cat => cat.tenantid === tenantId || tenantId === "demo");
};

export const getAccountCategoryById = async (id: string, tenantId: string) => {
  return mockCategories.find(cat => cat.id === id && (cat.tenantid === tenantId || tenantId === "demo")) ?? null;
};

export const createAccountCategory = async (accountCategory: Inserts<any>) => {
  return { ...accountCategory, id: String(Date.now()) };
};

export const updateAccountCategory = async (accountCategory: Updates<any>) => {
  return { ...accountCategory };
};

export const deleteAccountCategory = async (id: string, userId: string) => {
  return { id, isdeleted: true, updatedby: userId ?? "demo" };
};

export const restoreAccountCategory = async (id: string, userId: string) => {
  return { id, isdeleted: false, updatedby: userId ?? "demo" };
};
