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



//Another GPT Code
export const handleUpdateTransaction = (
  fullFormTransaction: TransactionFormType,
  originalTransaction: TransactionFormType,
  sourceAccount: Account,
  destinationAccount: Account | null,
  currentTimestamp: string,
  userId: string,
) => {
  const updatedTransaction: Updates<TableNames.Transactions> = {
    id: originalTransaction.id ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  const updatedAccount: Updates<TableNames.Accounts> = {
    id: sourceAccount.id,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  const updatedTransferTransaction: Updates<TableNames.Transactions> = {
    id: originalTransaction.transferid ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  const updatedTransferAccount: Updates<TableNames.Accounts> = {
    id: destinationAccount?.id ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  // Consolidated logic for balance changes
  const updateAccountBalances = (
    oldTransaction: TransactionFormType,
    newTransaction: TransactionFormType,
    oldAccount: Account,
    newAccount: Account | null,
  ) => {
    let newSourceBalance = oldAccount.balance;
    let newDestinationBalance = newAccount?.balance ?? 0;

    // Reverse the original transaction's effect if status is "None"
    if (oldTransaction.status === "None") {
      newSourceBalance -= oldTransaction.amount;
      if (oldTransaction.type === "Transfer" && newAccount) {
        newDestinationBalance += oldTransaction.amount;
      }
    }

    // Apply the new transaction's effect if status is "None"
    if (newTransaction.status === "None") {
      newSourceBalance += newTransaction.amount;
      if (newTransaction.type === "Transfer" && newAccount) {
        newDestinationBalance -= newTransaction.amount;
      }
    }

    return { newSourceBalance, newDestinationBalance };
  };

  // Status change logic (None -> Void or vice versa)
  const handleStatusChange = () => {
    updatedTransaction.status = fullFormTransaction.status ?? undefined;
    updatedTransferTransaction.status = fullFormTransaction.status ?? undefined;
    if (fullFormTransaction.status !== originalTransaction.status) {
      const { newSourceBalance, newDestinationBalance } = updateAccountBalances(
        originalTransaction,
        fullFormTransaction,
        sourceAccount,
        destinationAccount,
      );
      updatedAccount.balance = newSourceBalance;
      if (destinationAccount) {
        updatedTransferAccount.balance = newDestinationBalance;
      }
    }
  };

  // Account ID change logic
  const handleAccountIdChange = () => {
    if (fullFormTransaction.accountid !== originalTransaction.accountid) {
      const oldAmount = originalTransaction.status === "None" ? originalTransaction.amount : 0;
      const newAmount = fullFormTransaction.status === "None" ? fullFormTransaction.amount : 0;

      // Update old account balance
      updateAccount({
        id: originalTransaction.accountid!,
        balance: sourceAccount.balance - oldAmount,
      });

      // Update new account balance
      updateAccount({
        id: fullFormTransaction.accountid!,
        balance: (destinationAccount?.balance ?? 0) + newAmount,
      });

      updatedTransaction.accountid = fullFormTransaction.accountid ?? undefined;
    }
  };

  // Transfer type change logic
  const handleTypeChange = () => {
    if (fullFormTransaction.type !== originalTransaction.type) {
      if (originalTransaction.type === "Transfer" && fullFormTransaction.type !== "Transfer") {
        // If changing from transfer to another type, void the transfer
        updatedTransferTransaction.isdeleted = true;
        if (originalTransaction.status === "None") {
          updatedTransferAccount.balance = (destinationAccount?.balance ?? 0) - originalTransaction.amount;
        }
      } else if (originalTransaction.type !== "Transfer" && fullFormTransaction.type === "Transfer") {
        // Create a new transfer transaction
        if (!originalTransaction.transferid) {
          createTransaction({
            description: fullFormTransaction.description,
            amount: -fullFormTransaction.amount,
            date: fullFormTransaction.date ?? currentTimestamp,
            notes: fullFormTransaction.notes,
            tags: fullFormTransaction.tags,
            status: fullFormTransaction.status ?? "None",
            categoryid: fullFormTransaction.categoryid,
            type: "Transfer",
            accountid: fullFormTransaction.transferaccountid!,
            transferid: originalTransaction.id,
            createdat: currentTimestamp,
            createdby: userId,
          });
        }
      }
    }
  };

  // Update values for the transaction fields that changed
  const updateTransactionFields = () => {
    if (fullFormTransaction.description !== originalTransaction.description) {
      updatedTransaction.description = fullFormTransaction.description;
    }
    if (fullFormTransaction.notes !== originalTransaction.notes) {
      updatedTransaction.notes = fullFormTransaction.notes;
    }
    if (fullFormTransaction.tags !== originalTransaction.tags) {
      updatedTransaction.tags = fullFormTransaction.tags;
    }
    if (fullFormTransaction.date !== originalTransaction.date) {
      updatedTransaction.date = fullFormTransaction.date ?? undefined;
      updatedTransferTransaction.date = fullFormTransaction.date ?? undefined;
    }
    if (fullFormTransaction.categoryid !== originalTransaction.categoryid) {
      updatedTransaction.categoryid = fullFormTransaction.categoryid;
      updatedTransferTransaction.categoryid = fullFormTransaction.categoryid;
    }
    if (fullFormTransaction.amount !== originalTransaction.amount) {
      updatedTransaction.amount = fullFormTransaction.amount;
      updatedTransferTransaction.amount = -fullFormTransaction.amount;
    }
  };

  // Apply updates
  updateTransactionFields();
  handleStatusChange();
  handleAccountIdChange();
  handleTypeChange();

  // Final updates
  updateTransaction(updatedTransaction);
  updateAccount(updatedAccount);
  if (updatedTransferTransaction.id) {
    updateTransaction(updatedTransferTransaction);
  }
  if (updatedTransferAccount.id) {
    updateAccount(updatedTransferAccount);
  }
};

///
export const handleUpdateTransaction = (
  fullFormTransaction: TransactionFormType,
  originalTransaction: TransactionFormType,
  sourceAccount: Account,
  destinationAccount: Account | null,
  currentTimestamp: string,
  userId: string,
) => {
  const updatedTransaction: Updates<TableNames.Transactions> = {
    id: originalTransaction.id ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
    status: fullFormTransaction.status ?? undefined,
  };

  const updatedAccount: Updates<TableNames.Accounts> = {
    id: sourceAccount.id,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  const updatedTransferTransaction: Updates<TableNames.Transactions> = {
    id: originalTransaction.transferid ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
    status: fullFormTransaction.status ?? undefined,
  };

  const updatedTransferAccount: Updates<TableNames.Accounts> = {
    id: destinationAccount?.id ?? undefined,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  // Function to reverse the effect of the original transaction on the old account
  const reverseOldTransactionEffect = (
    oldTransaction: TransactionFormType,
    oldAccountId: string,
    newAccount: Account | null,
  ) => {
    const oldAccountBalance =
      queryClient.getQueryData<Account[]>([TableNames.Accounts])?.find(account => account.id === oldAccountId)
        ?.balance ?? 0;

    let newSourceBalance = oldAccountBalance;
    let newDestinationBalance = newAccount?.balance ?? 0;

    // Reverse the original transaction effect if status was "None"
    if (oldTransaction.status === "None") {
      newSourceBalance -= oldTransaction.amount;
      if (oldTransaction.type === "Transfer" && newAccount) {
        newDestinationBalance += oldTransaction.amount;
      }
    } else if (oldTransaction.status !== fullFormTransaction.status) {
      // Revert the old transaction effect when status changes
      newSourceBalance -= oldTransaction.amount;
      if (oldTransaction.type === "Transfer" && newAccount) {
        newDestinationBalance += oldTransaction.amount;
      }
    }

    return { newSourceBalance, newDestinationBalance };
  };

  // Function to apply the effect of the new transaction
  const applyNewTransactionEffect = (
    newTransaction: TransactionFormType,
    newAccount: Account | null,
    sourceAccountBalance: number,
  ) => {
    let updatedSourceBalance = sourceAccountBalance;
    let updatedDestinationBalance = newAccount?.balance ?? 0;

    // Apply the new transaction effect if status is "None"
    if (newTransaction.status === "None") {
      updatedSourceBalance += newTransaction.amount;
      if (newTransaction.type === "Transfer" && newAccount) {
        updatedDestinationBalance -= newTransaction.amount;
      }
    }

    return { updatedSourceBalance, updatedDestinationBalance };
  };

  const handleAllChanges = () => {
    const oldAccountId = originalTransaction.accountid!;
    const newAccountId = fullFormTransaction.accountid!;

    // Reverse the effect of the old transaction on the old account
    if (oldAccountId !== newAccountId) {
      const { newSourceBalance } = reverseOldTransactionEffect(originalTransaction, oldAccountId, destinationAccount);

      // Update the old account balance only if it changes
      if (newSourceBalance !== sourceAccount.balance) {
        updateAccount({
          id: oldAccountId,
          balance: newSourceBalance,
        });
      }
    }

    // Apply the new transaction effect to the new account if needed
    const { updatedSourceBalance, updatedDestinationBalance } = applyNewTransactionEffect(
      fullFormTransaction,
      destinationAccount,
      sourceAccount.balance,
    );

    // Update the new account balance if it has changed
    if (newAccountId !== oldAccountId && updatedSourceBalance !== sourceAccount.balance) {
      updateAccount({
        id: newAccountId,
        balance: updatedSourceBalance,
      });
    }

    if (destinationAccount && updatedDestinationBalance !== destinationAccount.balance) {
      updateAccount({
        id: destinationAccount.id,
        balance: updatedDestinationBalance,
      });
    }
  };

  // Update fields based on the changes
  const updateTransactionFields = () => {
    if (fullFormTransaction.description !== originalTransaction.description) {
      updatedTransaction.description = fullFormTransaction.description;
    }
    if (fullFormTransaction.notes !== originalTransaction.notes) {
      updatedTransaction.notes = fullFormTransaction.notes;
    }
    if (fullFormTransaction.tags !== originalTransaction.tags) {
      updatedTransaction.tags = fullFormTransaction.tags;
    }
    if (fullFormTransaction.date !== originalTransaction.date) {
      updatedTransaction.date = fullFormTransaction.date ?? undefined;
      updatedTransferTransaction.date = fullFormTransaction.date ?? undefined;
    }
    if (fullFormTransaction.categoryid !== originalTransaction.categoryid) {
      updatedTransaction.categoryid = fullFormTransaction.categoryid;
      updatedTransferTransaction.categoryid = fullFormTransaction.categoryid;
    }
    if (fullFormTransaction.amount !== originalTransaction.amount) {
      updatedTransaction.amount = fullFormTransaction.amount;
      updatedTransferTransaction.amount = -fullFormTransaction.amount;
    }
  };

  // Execute changes
  updateTransactionFields();
  handleAllChanges();

  // Finalize updates
  updateTransaction(updatedTransaction);
  updateAccount(updatedAccount);
  if (updatedTransferTransaction.id) {
    updateTransaction(updatedTransferTransaction);
  }
  if (updatedTransferAccount.id) {
    updateAccount(updatedTransferAccount);
  }
};
