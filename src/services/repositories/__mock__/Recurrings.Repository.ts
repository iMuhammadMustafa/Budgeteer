// Mock Recurrings.Repository for demo mode

import { useQuery, useMutation } from "@tanstack/react-query";
import { Recurring } from "@/src/types/db/Tables.Types";

// Example mock data
const mockRecurrings: Recurring[] = [
  {
    id: "rec-1",
    name: "Monthly Rent",
    amount: 1200,
    currencycode: "USD",
    sourceaccountid: "acc-1",
    categoryid: "cat-1",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-01",
    enddate: null,
    lastexecutedat: null,
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    description: "Pay rent to landlord",
    notes: null,
    payeename: "Landlord",
    type: "Expense",
  },
  {
    id: "rec-2",
    name: "Gym Membership",
    amount: 50,
    currencycode: "USD",
    sourceaccountid: "acc-1",
    categoryid: "cat-2",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-05",
    enddate: null,
    lastexecutedat: null,
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    description: "Monthly gym fee",
    notes: null,
    payeename: "Gym",
    type: "Expense",
  },
  {
    id: "rec-3",
    name: "Internet Subscription",
    amount: 60,
    currencycode: "USD",
    sourceaccountid: "acc-6",
    categoryid: "cat-3",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-10",
    enddate: null,
    lastexecutedat: null,
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    description: "Monthly internet bill",
    notes: null,
    payeename: "ISP",
    type: "Expense",
  },
  {
    id: "rec-4",
    name: "Car Loan Payment",
    amount: 400,
    currencycode: "USD",
    sourceaccountid: "acc-5",
    categoryid: "cat-5",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-15",
    enddate: null,
    lastexecutedat: null,
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    description: "Monthly car loan payment",
    notes: null,
    payeename: "Bank",
    type: "Expense",
  },
  {
    id: "rec-5",
    name: "Investment Deposit",
    amount: 500,
    currencycode: "USD",
    sourceaccountid: "acc-4",
    categoryid: "cat-4",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-20",
    enddate: null,
    lastexecutedat: null,
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    description: "Monthly investment deposit",
    notes: null,
    payeename: "Broker",
    type: "Expense",
  },
];

let inMemoryRecurrings = [...mockRecurrings];

export const useListRecurrings = () => {
  return useQuery<Recurring[]>({
    queryKey: ["Recurrings", "demo"],
    queryFn: async () => inMemoryRecurrings,
    initialData: inMemoryRecurrings,
  });
};

export const useGetRecurring = (id?: string) => {
  return useQuery<Recurring | undefined>({
    queryKey: ["Recurrings", id, "demo"],
    queryFn: async () => inMemoryRecurrings.find(rec => rec.id === id),
    enabled: !!id,
    initialData: () => inMemoryRecurrings.find(rec => rec.id === id),
  });
};

export const useCreateRecurring = () => {
  return useMutation({
    mutationFn: async (recurring: Partial<Recurring>) => {
      const newRecurring = {
        ...recurring,
        id: `rec-${Date.now()}`,
        createdat: new Date().toISOString(),
        createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
        isdeleted: false,
        isactive: true,
        tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
      } as Recurring;
      inMemoryRecurrings = [...inMemoryRecurrings, newRecurring];
      return newRecurring;
    },
  });
};

export const useUpdateRecurring = () => {
  return useMutation({
    mutationFn: async ({ id, recurringData }: { id: string; recurringData: Partial<Recurring> }) => {
      inMemoryRecurrings = inMemoryRecurrings.map(rec =>
        rec.id === id ? { ...rec, ...recurringData, updatedat: new Date().toISOString() } : rec,
      );
      return inMemoryRecurrings.find(rec => rec.id === id);
    },
  });
};

export const useDeleteRecurring = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      inMemoryRecurrings = inMemoryRecurrings.map(rec =>
        rec.id === id ? { ...rec, isdeleted: true, updatedat: new Date().toISOString() } : rec,
      );
      return inMemoryRecurrings.find(rec => rec.id === id);
    },
  });
};

// Simulate execution of a recurring (creates a transaction and updates next occurrence)
export const useExecuteRecurringAction = () => {
  return useMutation({
    mutationFn: async ({ item, amount }: { item: Recurring; amount?: number }) => {
      // Simulate transaction creation and update recurring
      const now = new Date();
      const executedAt = now.toISOString();
      const newNextOccurrence = new Date(now.setMonth(now.getMonth() + 1)).toISOString().slice(0, 10);

      inMemoryRecurrings = inMemoryRecurrings.map(rec =>
        rec.id === item.id
          ? {
              ...rec,
              lastexecutedat: executedAt,
              nextoccurrencedate: newNextOccurrence,
              updatedat: executedAt,
            }
          : rec,
      );

      return {
        newTransaction: {
          id: `txn-${Date.now()}`,
          accountid: item.sourceaccountid,
          amount: amount ?? item.amount,
          date: executedAt,
          type: "Expense",
        },
        updatedRecurring: inMemoryRecurrings.find(rec => rec.id === item.id),
      };
    },
  });
};
