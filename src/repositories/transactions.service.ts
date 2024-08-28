import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTransactions } from "./api";
import { Transaction, Updates } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { TableNames } from "@/src/consts/TableNames";

import {
  getTransactionById,
  updateTransaction,
  createTransaction,
  deleteTransaction,
  restoreTransaction,
} from "./transactions.api";

export const useGetTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: getAllTransactions,
  });
};

export const useGetTransactionById = (id?: string) => {
  return useQuery<Transaction>({
    queryKey: [TableNames.Transactions, id],
    queryFn: async () => getTransactionById(id!),
    enabled: !!id,
  });
};

export const useUpsertTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth().session || {};

  return useMutation({
    mutationFn: async (formTransaction: Transaction | Updates<TableNames.Transactions>) => {
      if (formTransaction.id) {
        formTransaction.updatedby = user?.id;
        formTransaction.updatedat = new Date().toISOString();
        return await updateTransaction(formTransaction);
      }
      formTransaction.createdby = user?.id;
      formTransaction.createdat = new Date().toISOString();
      return await createTransaction(formTransaction as Transaction);
    },
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions, id] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteTransaction(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};
export const useRestoreTransaction = (id: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return await restoreTransaction(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};

// __mocks__/supabase.ts
// export const mockSupabase = {
//   from: jest.fn().mockReturnThis(),
//   select: jest.fn().mockReturnThis(),
//   eq: jest.fn().mockReturnThis(),
//   single: jest.fn().mockResolvedValue({ data: null, error: null }),
//   insert: jest.fn().mockReturnThis(),
//   update: jest.fn().mockReturnThis(),
//   // You can add more methods if needed
// };

// // transactions.service.test.ts
// import {
//   getAllTransactions,
//   getTransactionById,
//   createTransaction,
//   updateTransaction,
//   deleteTransaction,
//   restoreTransaction,
//   deleteAccountTransactions,
//   restoreAccountTransactions
// } from './transactions.service';
// import { mockSupabase } from './__mocks__/supabase';
// import { supabase } from './supabaseClient'; // Adjust the import according to your setup

// jest.mock('./supabaseClient', () => ({
//   supabase: mockSupabase,
// }));

// describe('Transactions Service', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   test('getAllTransactions should return data', async () => {
//     const mockData = [{ id: '1', amount: 100 }];
//     mockSupabase.select.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await getAllTransactions();
//     expect(result).toEqual(mockData);
//   });

//   test('getTransactionById should return a single transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await getTransactionById('1');
//     expect(result).toEqual(mockData);
//   });

//   test('createTransaction should create and return a transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.insert.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await createTransaction({ amount: 100 });
//     expect(result).toEqual(mockData);
//   });

//   test('updateTransaction should update and return a transaction', async () => {
//     const mockData = { id: '1', amount: 100 };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await updateTransaction({ id: '1', amount: 100 });
//     expect(result).toEqual(mockData);
//   });

//   test('deleteTransaction should mark transaction as deleted', async () => {
//     const mockData = { id: '1', isdeleted: true };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await deleteTransaction('1');
//     expect(result).toEqual(mockData);
//   });

//   test('restoreTransaction should restore a deleted transaction', async () => {
//     const mockData = { id: '1', isdeleted: false };
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await restoreTransaction('1');
//     expect(result).toEqual(mockData);
//   });

//   test('deleteAccountTransactions should mark transactions of an account as deleted', async () => {
//     const mockData = [{ id: '1', isdeleted: true }];
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await deleteAccountTransactions('accountId');
//     expect(result).toEqual(mockData);
//   });

//   test('restoreAccountTransactions should restore transactions of an account', async () => {
//     const mockData = [{ id: '1', isdeleted: false }];
//     mockSupabase.update.mockResolvedValueOnce({ data: mockData, error: null });

//     const result = await restoreAccountTransactions('accountId');
//     expect(result).toEqual(mockData);
//   });
// });
//--
//
// import { useGetTransactions } from "../transactions.service";
// import QueryProvider from "@/src/providers/QueryProvider";
// import ThemeProvider from "@/src/providers/ThemeProvider";
// import AuthProvider from "@/src/providers/AuthProvider";
// import NotificationsProvider from "@/src/providers/NotificationsProvider";
// import { supabase } from "@/src/lib/supabase";
// import * as transactionsService from "../transactions.service";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// const mockData = [
//   {
//     id: "27d7d854-4ec2-4339-88f4-77b6259503b6",
//     amount: 0,
//     date: "2024-08-26T02:07:11.259+00:00",
//     categoryid: null,
//     tags: null,
//     notes: null,
//     accountid: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
//     createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//     createdat: "2024-08-26T02:07:11.346321+00:00",
//     updatedby: null,
//     updatedat: null,
//     isdeleted: false,
//     tenantid: null,
//     type: "Initial",
//     description: "Account Opened",
//     account: {
//       id: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
//       name: "ACC",
//       notes: "",
//       balance: 1000,
//       currency: "USD",
//       tenantid: null,
//       createdat: "2024-08-26T02:07:11.259+00:00",
//       createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//       isdeleted: true,
//       updatedat: "2024-08-26T13:21:47.437+00:00",
//       updatedby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
//       categoryid: "2624d252-8fc9-45a0-a1ca-42e9a7b4e02e",
//     },
//     category: null,
//   },
// ];
// // Mock supabase client
// jest.mock("@/src/lib/supabase", () => ({
//   supabase: {
//     from: jest.fn().mockReturnThis(),
//     select: jest.fn().mockReturnThis(),
//     eq: jest.fn().mockImplementation((column, value) => {
//       return {
//         data: mockData.filter(item => item[column] === value),
//         error: null,
//       };
//     }),
//     auth: {
//       onAuthStateChange: jest.fn(),
//       getSession: jest.fn().mockResolvedValue({
//         data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
//         error: null,
//       }),
//     },
//   },
// }));
// jest.mock("@react-native-async-storage/async-storage", () => ({
//   getItem: jest.fn().mockResolvedValue(Promise.resolve("light")),
//   setItem: jest.fn().mockResolvedValue(null),
//   removeItem: jest.fn().mockResolvedValue(null),
// }));
// jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));

// jest.mock("../transactions.service.ts", () => ({
//   getAllTransactions: jest.fn().mockImplementation(async () => Promise.resolve(mockData)),
// }));

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: false,
//     },
//   },
// });
// const wrapper = ({ children }: { children: any }) => {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <QueryClientProvider client={queryClient}>
//           <NotificationsProvider>{children}</NotificationsProvider>
//         </QueryClientProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// };

//   // it("Should return an error if the query fails", async () => {
//   //   const expectedError = new Error("Failed to fetch transactions");

//   //   jest.spyOn(transactionsService, "getAllTransactions").mockRejectedValue(expectedError);

//   //   const { result } = renderHook(() => useGetTransactions(), { wrapper });

//   //   await waitFor(() => result.current.isError);

//   //   expect(result.current.error).toBe(expectedError);
//   // });
