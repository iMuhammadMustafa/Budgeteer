export const handleUpdateTransaction = (
  fullFormTransaction,
  originalTransaction,
  sourceAccount,
  destinationAccount,
  currentTimestamp,
  userId,
) => {
  const updatedTransaction = {
    id: originalTransaction.id,
    updatedAt: currentTimestamp,
    updatedBy: userId,
  };
  const updatedAccount = {
    id: sourceAccount.id,
    timestamp: currentTimestamp,
    updatedBy: userId,
  };
  const updatedTransferTransaction = {
    id: originalTransaction.transferId,
    timestamp: currentTimestamp,
    updatedBy: userId,
  };
  const updatedTransferAccount = {
    id: destinationAccount.id,
    timestamp: currentTimestamp,
    updatedBy: userId,
  };

  // Update Transaction's Values
  if (fullFormTransaction.description != originalTransaction.description) {
    updatedTransaction.description = fullFormTransaction.description;
  }
  if (fullFormTransaction.notes != originalTransaction.notes) {
    updatedTransaction.notes = fullFormTransaction.notes;
  }
  if (fullFormTransaction.tags != originalTransaction.tags) {
    updatedTransaction.tags = fullFormTransaction.tags;
  }
  if (fullFormTransaction.date != originalTransaction.date) {
    updatedTransaction.date = fullFormTransaction.date;
    updatedTransferTransaction.date = fullFormTransaction.date;
  }
  if (fullFormTransaction.categoryid != originalTransaction.categoryid) {
    updatedTransaction.categoryid = fullFormTransaction.categoryid;
    updatedTransferTransaction.categoryid = fullFormTransaction.categoryid;
  }
  if (fullFormTransaction.amount != originalTransaction.amount) {
    let amount = fullFormTransaction.amount;

    updatedTransaction.amount = amount;
    updatedTransferTransaction.amount = -amount;
  }
  // Account Actionable Changes
  if (fullFormTransaction.status != originalTransaction.status) {
    updatedTransaction.status = fullFormTransaction.status;
  }
  if (fullFormTransaction.type != originalTransaction.type) {
    updatedTransaction.type = fullFormTransaction.type;

    if (originalTransaction.type === "Transfer" && fullFormTransaction.type !== "Transfer") {
      updatedTransferTransaction.isdeleted = true;
    }
    if (originalTransaction.type !== "Transfer" && fullFormTransaction.type === "Transfer") {
      if (originalTransaction.transferId) {
        updatedTransferTransaction.isdeleted = true;
      } else {
        updatedTransaction.transferaccountid = fullFormTransaction.transferaccountid;
        createTransaction({
          description: fullFormTransaction.description,
          amount: updatedTransferTransaction.amount ?? -fullFormTransaction.amount,
          date: fullFormTransaction.date,
          notes: fullFormTransaction.notes,
          tags: fullFormTransaction.tags,
          status: fullFormTransaction.status,
          categoryid: fullFormTransaction.categoryid,
          type: "Transfer",

          accountid: fullFormTransaction.transferaccountid,
          transferid: originalTransaction.id,

          createdAt: currentTimestamp,
          createdBy: userId,
        });
      }
    }
  }

  // Update Account's Values
  if (fullFormTransaction.accountid == originalTransaction.accountid) {
    let newAccountBalance = sourceAccount.balance - originalTransaction.amount + fullFormTransaction.amount;

    updatedAccount.balance = newAccountBalance;

    if (fullFormTransaction.status !== "None") {
      updatedAccount.balance = sourceAccount.balance - originalTransaction.amount;
    }
  } else {
    updatedTransaction.accountid = fullFormTransaction.accountid;
    updatedAccount.id = fullFormTransaction.accountid;

    if (fullFormTransaction.status !== "None") {
      updatedAccount.balance = sourceAccount.balance + fullFormTransaction.amount;
    }

    const oldAmount = originalTransaction.status === "None" ? 0 : originalTransaction.amount;
    updatedAccount({
      id: originalTransaction.accountid,
      balance: originalTransaction.balance - oldAmount,
    });
  }
  if (fullFormTransaction.transferaccountid == originalTransaction.transferaccountid) {
    let transferAmount = -fullFormTransaction.amount;
    let originalTransferAmount = -originalTransaction.amount;

    let newTransferAccountBalance = destinationAccount.balance - originalTransferAmount - transferAmount;

    updatedTransferAccount.balance = newTransferAccountBalance;
    if (fullFormTransaction.status !== "None") {
      updatedTransferAccount.balance = destinationAccount.balance - originalTransferAmount;
    }
  } else {
    updatedTransaction.transferaccountid = fullFormTransaction.transferaccountid;
    updatedTransferAccount.id = fullFormTransaction.transferaccountid;

    let transferAmount = -fullFormTransaction.amount;
    let originalTransferAmount = -originalTransaction.amount;

    if (fullFormTransaction.status !== "None") {
      updatedTransferAccount.balance = destinationAccount.balance + transferAmount;
    }

    const oldTransferAmount = originalTransaction.status === "None" ? 0 : originalTransferAmount;

    updatedTransferAccount({
      id: originalTransaction.transferaccountid,
      balance: getAccountById(originalTransaction.transferaccountid).balance - oldTransferAmount,
    });
  }

  if (fullFormTransaction.type != originalTransaction.type) {
    if (originalTransaction.type === "Transfer" && fullFormTransaction.type !== "Transfer") {
      if (originalTransaction.status !== "None") {
        updatedTransferAccount.balance = destinationAccount.balance - originalTransaction.amount;
      }
    }
    if (originalTransaction.type !== "Transfer" && fullFormTransaction.type === "Transfer") {
      updatedTransferAccount.id = fullFormTransaction.transferaccountid;
      updatedTransferAccount.balance =
        getAccountById(fullFormTransaction.transferaccountid).balance + updatedTransferTransaction.amount;
    }
  }

  updateTransaction(updatedTransaction);
  updateAccount(updatedAccount);
  if (updatedTransferTransaction.id) {
    updateTransaction(updatedTransferTransaction);
  }
  if (updatedTransferAccount.id) {
    updateAccount(updatedTransferAccount);
  }
};
