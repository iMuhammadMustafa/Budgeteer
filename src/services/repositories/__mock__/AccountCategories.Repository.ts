// Mock AccountCategories.Repository for demo mode

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AccountCategory } from "@/src/types/db/Tables.Types";

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

let inMemoryCategories = [...mockCategories];

export const useGetAccountCategories = () => {
  return useQuery<AccountCategory[]>({
    queryKey: ["AccountCategories", "demo"],
    queryFn: async () => inMemoryCategories,
    initialData: inMemoryCategories,
  });
};

export const useGetAccountCategoryById = (id?: string) => {
  return useQuery<AccountCategory | undefined>({
    queryKey: ["AccountCategories", id, "demo"],
    queryFn: async () => inMemoryCategories.find(cat => cat.id === id),
    enabled: !!id,
    initialData: () => inMemoryCategories.find(cat => cat.id === id),
  });
};

export const useCreateAccountCategory = () => {
  return useMutation({
    mutationFn: async (accountCategory: Partial<AccountCategory>) => {
      const newCategory = {
        ...accountCategory,
        id: `cat-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryCategories.length + 1,
        type: accountCategory.type || "Asset",
      } as AccountCategory;
      inMemoryCategories = [...inMemoryCategories, newCategory];
      return newCategory;
    },
  });
};

export const useUpdateAccountCategory = () => {
  return useMutation({
    mutationFn: async ({
      accountCategory,
    }: {
      accountCategory: Partial<AccountCategory>;
      originalData: AccountCategory;
    }) => {
      inMemoryCategories = inMemoryCategories.map(cat =>
        cat.id === accountCategory.id ? { ...cat, ...accountCategory, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryCategories.find(cat => cat.id === accountCategory.id);
    },
  });
};

export const useUpsertAccountCategory = () => {
  return useMutation({
    mutationFn: async ({
      formData,
      originalData,
    }: {
      formData: Partial<AccountCategory>;
      originalData?: AccountCategory;
    }) => {
      if (formData.id && originalData) {
        inMemoryCategories = inMemoryCategories.map(cat =>
          cat.id === formData.id ? { ...cat, ...formData, updatedat: new Date().toISOString() } : cat,
        );
        return inMemoryCategories.find(cat => cat.id === formData.id);
      }
      const newCategory = {
        ...formData,
        id: `cat-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryCategories.length + 1,
        type: formData.type || "Asset",
      } as AccountCategory;
      inMemoryCategories = [...inMemoryCategories, newCategory];
      return newCategory;
    },
  });
};

export const useDeleteAccountCategory = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryCategories = inMemoryCategories.map(cat =>
        cat.id === id ? { ...cat, isdeleted: true, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryCategories.find(cat => cat.id === id);
    },
  });
};

export const useRestoreAccountCategory = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryCategories = inMemoryCategories.map(cat =>
        cat.id === id ? { ...cat, isdeleted: false, updatedat: new Date().toISOString() } : cat,
      );
      return inMemoryCategories.find(cat => cat.id === id);
    },
  });
};
