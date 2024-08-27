import { renderHook } from "@testing-library/react-native";
import { waitFor } from "@testing-library/react-native";
import { useGetTransactions } from "../transactions.service";
import QueryProvider from "@/src/providers/QueryProvider";
import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";
import NotificationsProvider from "@/src/providers/NotificationsProvider";
import { supabase } from "@/src/lib/supabase";

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
      name: "ACC",
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
// Mock supabase client
jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockImplementation((column, value) => {
      return {
        data: mockData.filter(item => item[column] === value),
        error: null,
      };
    }),
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
        error: null,
      }),
    },
  },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));
jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));

jest.mock("../transactions.service", () => ({
  getAllTransactions: jest.fn().mockImplementation(() => mockData),
}));
const wrapper = ({ children }: { children: any }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe("useGetTransactions", () => {
  it("should fetch transactions successfully", async () => {
    const { result } = renderHook(() => useGetTransactions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data.length).toBe(mockData.length);
    expect(result.current.isError).toBe(false);
  });

  //   it("Should return an error if the query fails", async () => {
  // const mockError = new Error("Failed to fetch transactions");
  //     (supabase.eq as jest.Mock).mockImplementation(() => ({
  //       data: null,
  //       error: mockError,
  //     }));

  //     const { result } = renderHook(() => useGetTransactions(), { wrapper });

  //     await waitFor(() => result.current.isSuccess);

  //     console.log(result.current.data);

  //     expect(result.current.error).toBe(error);
  //   });
});
