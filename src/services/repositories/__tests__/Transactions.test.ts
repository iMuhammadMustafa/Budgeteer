import { Session } from "@supabase/supabase-js";
import { updateTransactionHelper } from "../Transactions.Repository";
import { updateTransaction } from "../../apis/Transactions.api";
import { updateAccountBalance } from "../../apis/Accounts.api";

jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000000" }));
// Mock the services
jest.mock("../../apis/Transactions.api", () => ({
  updateTransaction: jest.fn(),
}));
jest.mock("../../apis/Accounts.api", () => ({
  updateAccountBalance: jest.fn(),
}));

const mockSession: Session = {
  user: {
    id: "user123",
    app_metadata: {
      provider: "email",
      roles: ["user"],
    },
    user_metadata: {
      full_name: "User Name",
    },
  },
};

const mockOriginalData = {
  id: "transaction123",
  name: "Original Name",
  date: "2023-10-01",
  payee: "Original Payee",
  description: "Original Description",
  tags: ["tag1", "tag2"],
  notes: "Original Notes",
  type: "expense",
  categoryid: "category123",
  isvoid: false,
  amount: 100,
  accountid: "account123",
  transferaccountid: "transferAccount123",
  transferid: "transferTransaction123",
  updatedat: "2023-10-01T00:00:00Z",
  updatedby: "user123",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("updateTransactionHelper", () => {
  it("should exit early if no changes are made", async () => {
    const formTransaction = { ...mockOriginalData };
    await (formTransaction, mockOriginalData, mockSession);

    expect(updateTransaction).not.toHaveBeenCalled();
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });

  it("should update non-amount fields", async () => {
    const formTransaction = { ...mockOriginalData, name: "New Name" };
    await updateTransactionHelper(formTransaction, mockOriginalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transaction123",
      name: "New Name",
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });

  it("should update amount for non-transfer transaction", async () => {
    const formTransaction = { ...mockOriginalData, amount: 200 };
    await updateTransactionHelper(formTransaction, mockOriginalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transaction123",
      amount: 200,
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", 100); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", 200); // New account adjustment
  });

  it("should update amount for transfer transaction", async () => {
    const formTransaction = { ...mockOriginalData, amount: 200 };
    await updateTransactionHelper(formTransaction, mockOriginalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transaction123",
      amount: 200,
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transferTransaction123",
      amount: -200,
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", 100); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", 200); // New account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("transferAccount123", -100); // Original transfer account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("transferAccount123", -200); // New transfer account adjustment
  });

  it("should void a transaction", async () => {
    const formTransaction = { ...mockOriginalData, isvoid: true };
    await updateTransactionHelper(formTransaction, mockOriginalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transaction123",
      isvoid: true,
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", -100); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("transferAccount123", 100); // Transfer account adjustment
  });

  it("should unvoid a transaction", async () => {
    const originalData = { ...mockOriginalData, isvoid: true };
    const formTransaction = { ...mockOriginalData, isvoid: false };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledWith({
      id: "transaction123",
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: "user123",
    });
    expect(updateAccountBalance).toHaveBeenCalledWith("account123", 100); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith("transferAccount123", -100); // Transfer account adjustment
  });

  it("should handle errors when updating account balances", async () => {
    const formTransaction = { ...mockOriginalData, amount: 200 };
    (updateAccountBalance as jest.Mock).mockRejectedValueOnce(new Error("Failed to update balance"));

    await expect(updateTransactionHelper(formTransaction, mockOriginalData, mockSession)).rejects.toThrow(
      "Failed to update account balances",
    );
  });
});
