import { updateTransactionHelper } from "../helpers/transactionHelper";
import { updateTransaction, updateAccountBalance } from "../services/api";

// Mock dependencies
jest.mock("../services/api", () => ({
  updateTransaction: jest.fn(),
  updateAccountBalance: jest.fn(),
}));

describe("updateTransactionHelper", () => {
  let session;

  beforeEach(() => {
    jest.clearAllMocks();
    session = { user: { id: "user123" } };
  });

  it("should not update if there are no changes", async () => {
    const formTransaction = { id: "txn1", name: "Same Name", amount: 100 };
    const originalData = { id: "txn1", name: "Same Name", amount: 100 };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateTransaction).not.toHaveBeenCalled();
    expect(updateAccountBalance).not.toHaveBeenCalled();
  });

  it("should update transaction when name is changed", async () => {
    const formTransaction = { id: "txn1", name: "New Name", amount: 100 };
    const originalData = { id: "txn1", name: "Old Name", amount: 100 };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateTransaction).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name" }));
  });

  it("should update account balance when amount changes", async () => {
    const formTransaction = { id: "txn1", amount: 200, accountid: "acc1" };
    const originalData = { id: "txn1", amount: 100, accountid: "acc1" };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateAccountBalance).toHaveBeenCalledWith("acc1", -100); // Deduct old amount
    expect(updateAccountBalance).toHaveBeenCalledWith("acc1", 200); // Add new amount
  });

  it("should void a transaction and remove amount from account", async () => {
    const formTransaction = { id: "txn1", isvoid: true, amount: 100, accountid: "acc1" };
    const originalData = { id: "txn1", isvoid: false, amount: 100, accountid: "acc1" };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateAccountBalance).toHaveBeenCalledWith("acc1", -100);
  });

  it("should unvoid a transaction and add amount to account", async () => {
    const formTransaction = { id: "txn1", isvoid: false, amount: 100, accountid: "acc1" };
    const originalData = { id: "txn1", isvoid: true, amount: 100, accountid: "acc1" };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateAccountBalance).toHaveBeenCalledWith("acc1", 100);
  });

  it("should update transfer transaction when amount changes", async () => {
    const formTransaction = { id: "txn1", amount: 200, transferid: "txn2", transferaccountid: "acc2" };
    const originalData = { id: "txn1", amount: 100, transferid: "txn2", transferaccountid: "acc2" };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "txn2", amount: -200 }), // Transfer transaction should be updated
    );
    expect(updateAccountBalance).toHaveBeenCalledWith("acc2", -200);
  });

  it("should handle account changes correctly", async () => {
    const formTransaction = { id: "txn1", accountid: "newAcc", amount: 100 };
    const originalData = { id: "txn1", accountid: "oldAcc", amount: 100 };

    await updateTransactionHelper(formTransaction, originalData, session);

    expect(updateAccountBalance).toHaveBeenCalledWith("oldAcc", -100); // Remove from old account
    expect(updateAccountBalance).toHaveBeenCalledWith("newAcc", 100); // Add to new account
  });
});
