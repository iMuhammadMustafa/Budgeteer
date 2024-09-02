import { supabase } from "@/src/lib/supabase";
import { getAllTransactions } from "../transactions.api";

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
      name: "XXXXXX",
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

jest.mock("@/src/lib/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockImplementation(() => ({
      data: [...mockData],
      error: null,
    })),
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: "00000000-0000-0000-0000-000000000000" } } },
        error: null,
      }),
    },
  },
}));

describe("useGetTransactions", () => {
  it("should fetch transactions successfully????", async () => {
    const data = await getAllTransactions();
    expect(data.length).toBe(mockData.length);
    expect(data[0]).toEqual(mockData[0]);
  });
  // it("should throw an error if supabase returns an error", async () => {
  //   jest.spyOn(supabase, "eq").mockRejectedValue(new Error("This is an error"));

  //   await expect(getAllTransactions()).rejects.toThrow(new Error("This is an error"));
  // });
});
