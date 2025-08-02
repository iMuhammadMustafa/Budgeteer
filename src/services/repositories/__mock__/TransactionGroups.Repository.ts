// Mock TransactionGroups.Repository for demo mode

import { useQuery, useMutation } from "@tanstack/react-query";
import { TransactionGroup } from "@/src/types/db/Tables.Types";

// Example mock data
const mockTransactionGroups: TransactionGroup[] = [
  {
    id: "tg-1",
    name: "Essentials",
    color: "#FF9800",
    icon: "home",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
  tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 1000,
    budgetfrequency: "Monthly",
    description: "Essential expenses",
  },
  {
    id: "tg-2",
    name: "Income",
    color: "#4CAF50",
    icon: "attach-money",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
  tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    budgetamount: 3000,
    budgetfrequency: "Monthly",
    description: "All income sources",
  },
  {
    id: "tg-3",
    name: "Leisure",
    color: "#03A9F4",
    icon: "sports-esports",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
  tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 500,
    budgetfrequency: "Monthly",
    description: "Leisure and entertainment",
  },
  {
    id: "tg-4",
    name: "Utilities",
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
    budgetamount: 400,
    budgetfrequency: "Monthly",
    description: "Utility bills",
  },
  {
    id: "tg-5",
    name: "Healthcare",
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
    budgetamount: 300,
    budgetfrequency: "Monthly",
    description: "Medical and healthcare",
  },
];

let inMemoryTransactionGroups = [...mockTransactionGroups];

export const useGetTransactionGroups = () => {
  return useQuery<TransactionGroup[]>({
    queryKey: ["TransactionGroups", "demo"],
    queryFn: async () => inMemoryTransactionGroups,
    initialData: inMemoryTransactionGroups,
  });
};

export const useGetTransactionGroupById = (id?: string) => {
  return useQuery<TransactionGroup | undefined>({
    queryKey: ["TransactionGroups", id, "demo"],
    queryFn: async () => inMemoryTransactionGroups.find(group => group.id === id),
    enabled: !!id,
    initialData: () => inMemoryTransactionGroups.find(group => group.id === id),
  });
};

export const useCreateTransactionGroup = () => {
  return useMutation({
    mutationFn: async (transactionGroup: Partial<TransactionGroup>) => {
      const newGroup = {
        ...transactionGroup,
        id: `tg-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
      tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryTransactionGroups.length + 1,
        type: transactionGroup.type || "Expense",
        budgetamount: transactionGroup.budgetamount ?? 0,
        budgetfrequency: transactionGroup.budgetfrequency ?? "Monthly",
      } as TransactionGroup;
      inMemoryTransactionGroups = [...inMemoryTransactionGroups, newGroup];
      return newGroup;
    },
  });
};

export const useUpdateTransactionGroup = () => {
  return useMutation({
    mutationFn: async ({
      accountGroup,
    }: {
      accountGroup: Partial<TransactionGroup>;
      originalData: TransactionGroup;
    }) => {
      inMemoryTransactionGroups = inMemoryTransactionGroups.map(group =>
        group.id === accountGroup.id ? { ...group, ...accountGroup, updatedat: new Date().toISOString() } : group,
      );
      return inMemoryTransactionGroups.find(group => group.id === accountGroup.id);
    },
  });
};

export const useUpsertTransactionGroup = () => {
  return useMutation({
    mutationFn: async ({
      formData,
      originalData,
    }: {
      formData: Partial<TransactionGroup>;
      originalData?: TransactionGroup;
    }) => {
      if (formData.id && originalData) {
        inMemoryTransactionGroups = inMemoryTransactionGroups.map(group =>
          group.id === formData.id ? { ...group, ...formData, updatedat: new Date().toISOString() } : group,
        );
        return inMemoryTransactionGroups.find(group => group.id === formData.id);
      }
      const newGroup = {
        ...formData,
        id: `tg-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
      tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        displayorder: inMemoryTransactionGroups.length + 1,
        type: formData.type || "Expense",
        budgetamount: formData.budgetamount ?? 0,
        budgetfrequency: formData.budgetfrequency ?? "Monthly",
      } as TransactionGroup;
      inMemoryTransactionGroups = [...inMemoryTransactionGroups, newGroup];
      return newGroup;
    },
  });
};

export const useDeleteTransactionGroup = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryTransactionGroups = inMemoryTransactionGroups.map(group =>
        group.id === id ? { ...group, isdeleted: true, updatedat: new Date().toISOString() } : group,
      );
      return inMemoryTransactionGroups.find(group => group.id === id);
    },
  });
};

export const useRestoreTransactionGroup = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryTransactionGroups = inMemoryTransactionGroups.map(group =>
        group.id === id ? { ...group, isdeleted: false, updatedat: new Date().toISOString() } : group,
      );
      return inMemoryTransactionGroups.find(group => group.id === id);
    },
  });
};
