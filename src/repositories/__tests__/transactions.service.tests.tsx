import { renderHook, waitFor } from "@testing-library/react-native";
import { useGetTransactions, useUpsertTransaction } from "@/src/repositories/transactions.service";
import * as transactionsApiService from "@/src/repositories/transactions.api";
import * as accountApiService from "@/src/repositories/account.api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Transaction } from "@/src/lib/supabase";
import AuthProvider from "@/src/providers/AuthProvider";

const mockData = [
  {
    id: "27d7d854-4ec2-4339-88f4-77b6259503b6",
    amount: 0,
    date: "2024-08-26T02:07:11.259+00:00",
    categoryid: null,
    tags: null,
    notes: null,
    accountid: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
    createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
    createdat: "2024-08-26T02:07:11.346321+00:00",
    updatedby: null,
    updatedat: null,
    isdeleted: false,
    tenantid: null,
    type: "Initial",
    description: "Account Opened",
    account: {
      id: "e04e02d4-aa4b-4d81-b89c-8ef8fefc5adf",
      name: "ZZZZZZZZZZ",
      notes: "",
      balance: 1000,
      currency: "USD",
      tenantid: null,
      createdat: "2024-08-26T02:07:11.259+00:00",
      createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
      isdeleted: true,
      updatedat: "2024-08-26T13:21:47.437+00:00",
      updatedby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
      categoryid: "2624d252-8fc9-45a0-a1ca-42e9a7b4e02e",
    },
    category: null,
  },
];
jest.mock("@/src/repositories/transactions.api", () => ({
  getAllTransactions: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
}));
jest.mock("@/src/repositories/account.api", () => ({
  getAccountById: jest.fn(),
  updateAccount: jest.fn(),
}));
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
        error: null,
      }),
    },
  },
}));
// jest.mock("@/src/providers/AuthProvider", () => ({
//   useAuth: () => ({
//     session: {
//       data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
//       error: null,
//     },
//   }),
// }));

const wrapper = ({ children }: { children: any }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AuthProvider>
  );
};

const mockTransaction: Transaction = {
  id: "transaction-id",
  amount: 100,
  accountid: "account-id",
  type: "Expense",
  date: "2024-08-30T00:00:00.000Z",
  categoryid: "8ccc0d26-c355-4cba-9b2c-b34445779406",
  tags: [""],
  notes: "",
  createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
  createdat: "2024-09-01T15:59:41.636+00:00",
  updatedby: null,
  updatedat: null,
  isdeleted: false,
  tenantid: null,
  description: "Test",
  transferid: null,
};

const mockAccount = {
  id: "account-id",
  balance: 1000,
  name: "Midwest",
  categoryid: "7ba98e57-fb26-4e47-a5e9-1f4ff641af62",
  currency: "USD",
  notes: "",
  createdby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
  createdat: "2024-08-31T13:57:40.811+00:00",
  updatedby: "d8d5efae-da25-4b50-870f-8774b83d73e9",
  updatedat: "2024-09-01T16:03:14.82+00:00",
  isdeleted: false,
  tenantid: null,
};

describe("useGetTransactions", () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should fetch transactions successfully", async () => {
    jest.spyOn(transactionsApiService, "getAllTransactions").mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useGetTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBe(mockData.length);
    expect(result.current.isError).toBe(false);
  });
  it("should return error when fetching transactions", async () => {
    jest.spyOn(transactionsApiService, "getAllTransactions").mockRejectedValue(new Error("error"));

    const { result } = renderHook(() => useGetTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBe(undefined);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("error");
  });
});

describe("useUpsertTransaction - Create Transaction", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new transaction and update account balance", async () => {
    jest.spyOn(accountApiService, "getAccountById").mockResolvedValue(mockAccount);
    jest.spyOn(transactionsApiService, "createTransaction").mockResolvedValue(mockTransaction);

    const { result } = renderHook(() => useUpsertTransaction(), { wrapper });

    result.current.mutateAsync({ fullFormTransaction: mockTransaction });

    await waitFor(() => expect(transactionsApiService.createTransaction).toHaveBeenCalled());
    await waitFor(() => expect(accountApiService.updateAccount).toHaveBeenCalled());

    expect(transactionsApiService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -100, // Adjusted for "Expense"
        accountid: mockTransaction.accountid,
      }),
    );

    expect(accountApiService.updateAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockTransaction.accountid,
        balance: mockAccount.balance - 100, // Deducted amount
      }),
    );
  });
});
