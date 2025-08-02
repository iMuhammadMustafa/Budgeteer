// Mock TransactionCategories.Repository for demo mode

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TransactionCategory } from "@/src/types/db/Tables.Types";

// Example mock data
const mockTransactionCategories: TransactionCategory[] = [
  {
    id: "tc-1",
    name: "Groceries",
    color: "#4CAF50",
    icon: "shopping-cart",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-1",
    budgetamount: 500,
    budgetfrequency: "Monthly",
    description: "Food and groceries",
  },
  {
    id: "tc-2",
    name: "Salary",
    color: "#2196F3",
    icon: "briefcase",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    groupid: "tg-2",
    budgetamount: 3000,
    budgetfrequency: "Monthly",
    description: "Monthly salary",
  },
  {
    id: "tc-3",
    name: "Dining Out",
    color: "#FF9800",
    icon: "restaurant",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-3",
    budgetamount: 200,
    budgetfrequency: "Monthly",
    description: "Restaurants and cafes",
  },
  {
    id: "tc-4",
    name: "Electricity",
    color: "#607D8B",
    icon: "flash-on",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 100,
    budgetfrequency: "Monthly",
    description: "Electricity bills",
  },
  {
    id: "tc-5",
    name: "Doctor Visits",
    color: "#E91E63",
    icon: "local-hospital",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-5",
    budgetamount: 150,
    budgetfrequency: "Monthly",
    description: "Medical expenses",
  },
  {
    id: "tc-6",
    name: "Internet",
    color: "#03A9F4",
    icon: "wifi",
    displayorder: 6,
    isdeleted: false,
    createdat: "2025-01-06T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 60,
    budgetfrequency: "Monthly",
    description: "Internet bills",
  },
  {
    id: "tc-7",
    name: "Games",
    color: "#8BC34A",
    icon: "sports-esports",
    displayorder: 7,
    isdeleted: false,
    createdat: "2025-01-07T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-3",
    budgetamount: 100,
    budgetfrequency: "Monthly",
    description: "Video games and entertainment",
  },
  {
    id: "tc-8",
    name: "Water",
    color: "#2196F3",
    icon: "opacity",
    displayorder: 8,
    isdeleted: false,
    createdat: "2025-01-08T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 40,
    budgetfrequency: "Monthly",
    description: "Water bills",
  },
  {
    id: "tc-9",
    name: "Pharmacy",
    color: "#F06292",
    icon: "local-pharmacy",
    displayorder: 9,
    isdeleted: false,
    createdat: "2025-01-09T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-5",
    budgetamount: 80,
    budgetfrequency: "Monthly",
    description: "Medicines and pharmacy",
  },
  {
    id: "tc-10",
    name: "Freelance Income",
    color: "#4CAF50",
    icon: "work",
    displayorder: 10,
    isdeleted: false,
    createdat: "2025-01-10T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    groupid: "tg-2",
    budgetamount: 1200,
    budgetfrequency: "Monthly",
    description: "Freelance projects",
  },
];

let inMemoryTransactionCategories = [...mockTransactionCategories];

export const useGetTransactionCategories = () => {
  return useQuery<TransactionCategory[]>({
    queryKey: ["TransactionCategories", "demo"],
    queryFn: async () => inMemoryTransactionCategories,
    initialData: inMemoryTransactionCategories,
  });
};

export const useGetTransactionCategoryById = (id?: string) => {
  return useQuery<TransactionCategory | undefined>({
    queryKey: ["TransactionCategories", id, "demo"],
    queryFn: async () => inMemoryTransactionCategories.find(cat => cat.id === id),
    enabled: !!id,
    initialData: () => inMemoryTransactionCategories.find(cat => cat.id === id),
  });
};

export const useCreateTransactionCategory = () => {
  return useMutation({
    mutationFn: async (transactionCategory: Partial<TransactionCategory>) => {
      const newCategory = {
        ...transactionCategory,
        id: `tc-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryTransactionCategories.length + 1,
        type: transactionCategory.type || "Expense",
        budgetamount: transactionCategory.budgetamount ?? 0,
        budgetfrequency: transactionCategory.budgetfrequency ?? "Monthly",
        groupid: transactionCategory.groupid ?? "tg-1",
      } as TransactionCategory;
      inMemoryTransactionCategories = [...inMemoryTransactionCategories, newCategory];
      return newCategory;
    },
  });
};

export const useUpdateTransactionCategory = () => {
  return useMutation({
    mutationFn: async ({
      accountCategory,
    }: {
      accountCategory: Partial<TransactionCategory>;
      originalData: TransactionCategory;
    }) => {
      inMemoryTransactionCategories = inMemoryTransactionCategories.map(cat =>
        cat.id === accountCategory.id ? { ...cat, ...accountCategory, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryTransactionCategories.find(cat => cat.id === accountCategory.id);
    },
  });
};

export const useUpsertTransactionCategory = () => {
  return useMutation({
    mutationFn: async ({
      formData,
      originalData,
    }: {
      formData: Partial<TransactionCategory>;
      originalData?: TransactionCategory;
    }) => {
      if (formData.id && originalData) {
        inMemoryTransactionCategories = inMemoryTransactionCategories.map(cat =>
          cat.id === formData.id ? { ...cat, ...formData, updatedat: new Date().toISOString() } : cat,
        );
        return inMemoryTransactionCategories.find(cat => cat.id === formData.id);
      }
      const newCategory = {
        ...formData,
        id: `tc-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryTransactionCategories.length + 1,
        type: formData.type || "Expense",
        budgetamount: formData.budgetamount ?? 0,
        budgetfrequency: formData.budgetfrequency ?? "Monthly",
        groupid: formData.groupid ?? "tg-1",
      } as TransactionCategory;
      inMemoryTransactionCategories = [...inMemoryTransactionCategories, newCategory];
      return newCategory;
    },
  });
};

export const useDeleteTransactionCategory = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryTransactionCategories = inMemoryTransactionCategories.map(cat =>
        cat.id === id ? { ...cat, isdeleted: true, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryTransactionCategories.find(cat => cat.id === id);
    },
  });
};

export const useRestoreTransactionCategory = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryTransactionCategories = inMemoryTransactionCategories.map(cat =>
        cat.id === id ? { ...cat, isdeleted: false, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryTransactionCategories.find(cat => cat.id === id);
    },
  });
};
