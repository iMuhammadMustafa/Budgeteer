import { Session } from "@supabase/supabase-js";
import { updateTransactionHelper } from "../Transactions.Service";
import { Transaction, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { updateTransaction } from "../../apis/Transactions.repository";
import { updateAccountBalance } from "../../apis/Accounts.repository";

jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000000" }));
jest.mock("../../apis/Transactions.api", () => ({
  updateTransaction: jest.fn(),
}));
jest.mock("../../apis/Accounts.api", () => ({
  updateAccountBalance: jest.fn(),
}));

const mockSession: Session = {
  user: {
    id: "user123",
    aud: "supabase",
    role: "authenticated",
    created_at: "2023-10-01T00:00:00Z",
    app_metadata: {
      provider: "email",
      roles: ["user"],
    },
    user_metadata: {
      full_name: "User Name",
      tenantid: "tenant123",
    },
  },
  access_token: "123",
  refresh_token: "123",
  expires_in: 123,
  token_type: "Bearer",
};

const originalTransaction: Transaction = {
  id: "transaction123",
  name: "Original Name",
  date: "2023-10-01",
  payee: "Original Payee",
  description: "Original Description",
  tags: ["tag1", "tag2"],
  notes: "Original Notes",
  type: "Expense",
  categoryid: "category123",
  isvoid: false,
  amount: -10,
  accountid: "account123",
  updatedat: "2023-10-01T00:00:00Z",
  updatedby: "user123",
  createdat: "2023-10-01T00:00:00Z",
  createdby: "user123",
  tenantid: "tenant123",
  isdeleted: false,
  transferaccountid: null,
  transferid: null,
};
const originalTransferTransaction = {
  ...originalTransaction,
  transferaccountid: "transferAccount123",
  transferid: "transferTransaction123",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Update Transaction Helper", () => {
  it("Should exit early if no changes are made", async () => {
    const formTransaction = { ...originalTransaction } as Updates<TableNames.Transactions>;
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).not.toHaveBeenCalled();
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });

  /* Handling Non-Account-Affecting fields */
  it("Should update non-account-affecting fields For Non Transfer", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      name: "New Name",
      description: "New Description",
      date: "2023-10-02",
      categoryid: "category456",
      payee: "New Payee",
      tags: ["tag3", "tag4"],
      notes: "New Notes",
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      name: formTransaction.name,
      description: formTransaction.description,
      date: formTransaction.date,
      categoryid: formTransaction.categoryid,
      payee: formTransaction.payee,
      tags: formTransaction.tags,
      notes: formTransaction.notes,

      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });
  it("Should update non-account-affecting fields For Transfer should update both transactions", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      name: "New Name",
      description: "New Description",
      date: "2023-10-02",
      categoryid: "category456",
      payee: "New Payee",
      tags: ["tag3", "tag4"],
      notes: "New Notes",
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      name: formTransaction.name,
      description: formTransaction.description,
      date: formTransaction.date,
      categoryid: formTransaction.categoryid,
      payee: formTransaction.payee,
      tags: formTransaction.tags,
      notes: formTransaction.notes,

      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      name: formTransaction.name,
      description: formTransaction.description,
      date: formTransaction.date,
      categoryid: formTransaction.categoryid,
      payee: formTransaction.payee,
      tags: formTransaction.tags,
      notes: formTransaction.notes,

      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });

  /* Handling Just Amount change */
  it("Should update amount for non-transfer transaction", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransaction,
      amount: -200,
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);

    const newAmount = formTransaction.amount - originalTransaction.amount;
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, newAmount); // Original account adjustment
  });
  it("Should update amount for transfer transaction", async () => {
    const formTransferTransction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      amount: -5,
    };
    await updateTransactionHelper(formTransferTransction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      amount: formTransferTransction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      amount: -formTransferTransction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    const newAmount = formTransferTransction.amount - originalTransferTransaction.amount;

    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransferTransaction.accountid, newAmount); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransferTransaction.transferaccountid, -newAmount); // Original transfer account adjustment
  });
  it("Shouldn't update account if amount changed but original was void", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalData,
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalData.id,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalData.transferid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(0);
  });

  /* Handling Just Voiding changes */
  it("Should Void Transaction Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: true,
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: true,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount); // Original account adjustment
  });
  it("Should Void Transfer Transaction Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      isvoid: true,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: true,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: true,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    ); // Original transfer account adjustment
  });
  /* Handling Just UnVoiding changes */
  it("Should UnVoid Transaction Correctly", async () => {
    const originalData = { ...originalTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: false,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, originalTransaction.amount); // Original account adjustment
  });
  it("Should UnVoid Transfer Transaction Correctly", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      isvoid: false,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      -originalTransferTransaction.amount,
    ); // Original transfer account adjustment
  });

  /* Handling Just Account Changes */
  it("Should Update Account Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      accountid: "newAccount123",
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      accountid: formTransaction.accountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, originalTransaction.amount); // New account adjustment
  });
  it("Should Update Transfer Account Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      transferaccountid: "newAccount123",
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      transferaccountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      accountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      formTransaction.transferaccountid,
      -originalTransferTransaction.amount,
    ); // New account adjustment
  });
  it("Should Update Accounts Correctly if both changed", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      accountid: "newAccount123",
      transferaccountid: "newTransferAccount123",
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      accountid: formTransaction.accountid,
      transferaccountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(4);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount); // New account adjustment

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.transferaccountid, -formTransaction.amount); // New account adjustment
  });

  /* Handling Both Account and Amount Changes */
  it("Should Update Account and Amount Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      accountid: "newAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      accountid: formTransaction.accountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount); // New account adjustment
  });
  it("Should Update Transfer Account and Amount Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      accountid: formTransaction.transferaccountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    );
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.transferaccountid, -formTransaction.amount);
  });
  it("Should Update Both Accounts and Amount Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      accountid: "newAccount123",
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      accountid: formTransaction.accountid,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(4);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    );
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    );
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.transferaccountid, -formTransaction.amount);
  });

  /* Handling both Voiding and Amount Change */
  it("Should Void and Update Amount Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: true,
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: true,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount); // Original account adjustment
  });
  it("Should Void and Update Amount Correctly for Transfer", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: true,
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: true,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: true,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    ); // Original transfer account adjustment
  });

  /* Handling both UnVoiding and Amount Change */
  it("Should UnVoid and Update Amount Correctly", async () => {
    const originalData = { ...originalTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransaction,
      isvoid: false,
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: false,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount); // New account adjustment
  });
  it("Should UnVoid and Update Amount Correctly for Transfer", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: false,
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransferTransaction.accountid, formTransaction.amount); // New account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      -formTransaction.amount,
    ); // New transfer account adjustment
  });
  it("Should UnVoid and Update Account's Correctly", async () => {
    const originalData = { ...originalTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransaction,
      isvoid: false,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, originalData.amount); // New account adjustment
  });
  it("Should UnVoid and Update Account's Correctly for Transfer", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: false,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransferTransaction.accountid, originalData.amount); // New account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      -originalData.amount,
    ); // New transfer account adjustment
  });

  /* Handling both Voiding and Account Changes */
  it("Should Void and Update Account Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: true,
      accountid: "newAccount123",
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: true,
      accountid: formTransaction.accountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount); // Original account adjustment
  });
  it("Should Void and Update Transfer Account Correctly", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      isvoid: true,
      transferaccountid: "newTransferAccount123",
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: true,
      transferaccountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: true,
      accountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    ); // Original account adjustment
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    ); // Original transfer account adjustment
  });

  /* Handling both UnVoiding and Account Change */
  it("Should UnVoid and Update Account Correctly", async () => {
    const originalData = { ...originalTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: false,
      accountid: "newAccount123",
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: false,
      accountid: formTransaction.accountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateAccountBalance).toHaveBeenCalledTimes(1);
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, originalTransaction.amount); // New account adjustment
  });
  it("Should UnVoid and Update Transfer Account Correctly", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: false,
      transferaccountid: "newTransferAccount123",
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      transferaccountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      accountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      originalTransferTransaction.amount,
    );
    expect(updateAccountBalance).toHaveBeenCalledWith(
      formTransaction.transferaccountid,
      -originalTransferTransaction.amount,
    );
  });
  it("Should UnVoid and Update Accounts Correctly if both changed", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransferTransaction,
      isvoid: false,
      accountid: "newAccount123",
      transferaccountid: "newTransferAccount123",
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      accountid: formTransaction.accountid,
      transferaccountid: formTransaction.transferaccountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, originalTransferTransaction.amount);
    expect(updateAccountBalance).toHaveBeenCalledWith(
      formTransaction.transferaccountid,
      -originalTransferTransaction.amount,
    );
  });

  // Handle Voiding, Account Change, Amount Change
  it("Should Void and Update Account and Amount Correctly, if these changed", async () => {
    const formTransaction: Updates<TableNames.Transactions> = {
      ...originalTransaction,
      isvoid: true,
      accountid: "newAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: true,
      accountid: formTransaction.accountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(1);

    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransaction.accountid, -originalTransaction.amount);
  });
  it("Should Void and Update Transfer Account and Amount Correctly, if these changed", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: true,
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: true,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });
    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: true,
      accountid: formTransaction.transferaccountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    );
    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    );
  });
  it("Should Void and Update Both Accounts and Amount Correctly, if these changed", async () => {
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: true,
      accountid: "newAccount123",
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalTransferTransaction, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: true,
      accountid: formTransaction.accountid,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: true,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.accountid,
      -originalTransferTransaction.amount,
    );

    expect(updateAccountBalance).toHaveBeenCalledWith(
      originalTransferTransaction.transferaccountid,
      originalTransferTransaction.amount,
    );
  });

  // Handle UnVoiding Account Change, Amount Change
  it("Should UnVoid and Update Account and Amount Correctly, if these changed", async () => {
    const originalData = { ...originalTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransaction,
      isvoid: false,
      accountid: "newAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction).toHaveBeenCalledWith({
      id: originalTransaction.id,
      isvoid: false,
      accountid: formTransaction.accountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(1);

    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount);
  });
  it("Should UnVoid and Update Transfer Account and Amount Correctly, if these changed", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: false,
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      accountid: formTransaction.transferaccountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(originalTransferTransaction.accountid, formTransaction.amount);
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.transferaccountid, -formTransaction.amount);
  });
  it("Should UnVoid and Update Both Accounts and Amount Correctly, if these changed", async () => {
    const originalData = { ...originalTransferTransaction, isvoid: true };
    const formTransaction: Updates<TableNames.Transactions> & { amount: number } = {
      ...originalTransferTransaction,
      isvoid: false,
      accountid: "newAccount123",
      transferaccountid: "newTransferAccount123",
      amount: 200,
    };
    await updateTransactionHelper(formTransaction, originalData, mockSession);

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    expect(updateTransaction).toHaveBeenNthCalledWith(1, {
      id: originalTransferTransaction.id,
      isvoid: false,
      accountid: formTransaction.accountid,
      transferaccountid: formTransaction.transferaccountid,
      amount: formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateTransaction).toHaveBeenNthCalledWith(2, {
      id: originalTransferTransaction.transferid,
      isvoid: false,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      amount: -formTransaction.amount,
      updatedat: expect.any(String),
      updatedby: mockSession.user.id,
    });

    expect(updateAccountBalance).toHaveBeenCalledTimes(2);

    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.accountid, formTransaction.amount);
    expect(updateAccountBalance).toHaveBeenCalledWith(formTransaction.transferaccountid, -formTransaction.amount);
  });
});
