// Mock implementation for TransactionGroups API

import { TransactionGroup } from "@/src/types/db/Tables.Types";

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

export const getAllTransactionGroups = async (tenantId: string) => [
  ...inMemoryTransactionGroups.map(group => ({
    ...group,
    tenantid: tenantId,
  })),
];

export const getTransactionGroupById = async (id: string, tenantId: string) => ({
  ...mockTransactionGroups.find(group => group.id === id),
  tenantid: tenantId,
});

export const createTransactionGroup = async (transactionGroup: any) => ({
  ...transactionGroup,
  id: `tg-${Math.random().toString(36).substring(2, 9)}`, // Generate a random ID
});

export const updateTransactionGroup = async (transactionGroup: any) => ({
  ...transactionGroup,
});

export const deleteTransactionGroup = async (id: string, userId: string) => ({
  id,
  isdeleted: true,
  updatedby: userId,
});

export const restoreTransactionGroup = async (id: string, userId: string) => ({
  id,
  isdeleted: false,
  updatedby: userId,
});
