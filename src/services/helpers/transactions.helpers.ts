/**
 * Pure transaction mutation helpers extracted from Transactions.Service so they
 * can be unit-tested without the React Query / provider graph. Behavior is
 * identical to the originals; repositories are injected as parameters.
 */
import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Transaction, Updates } from "@/src/types/database/Tables.Types";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";

export const createTransactionHelper = async (
  formTransaction: Inserts<TableNames.Transactions>,
  session: Session,
  repo: ITransactionRepository,
  accountRepo: IAccountRepository,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;
  const transactions: Inserts<TableNames.Transactions>[] = [];

  const id = GenerateUuid();
  const transferid = formTransaction.type === "Transfer" ? GenerateUuid() : undefined;

  formTransaction.id = id;
  // IMPORTANT:
  // For local SQLite, `transferid` has an immediate FK to `transactions(id)`.
  // If both transfer rows point to each other at insert time, the first insert can fail
  // because the referenced row does not yet exist.
  // So we insert source row first without transferid, then insert the paired row,
  // and finally link source -> paired via an update.
  formTransaction.transferid = undefined;
  formTransaction.createdat = new Date().toISOString();
  formTransaction.createdby = userId;
  formTransaction.tenantid = tenantid;
  formTransaction.updatedby = userId;

  transactions.push(formTransaction);

  if (transferid && formTransaction.transferaccountid) {
    const transferTransaction = {
      ...formTransaction,
      id: transferid,
      transferid: id,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      amount: -formTransaction.amount!,
      date: dayjs(formTransaction.date).add(1, "second").toISOString(),
    };
    transactions.push(transferTransaction);
  }

  const newTransactions = await repo.createMultiple!(transactions, tenantid);

  // TODO: This linking step is necessary due to the way SQLite handles FK constraints, but ideally we would handle this within a single transaction in the repository layer to ensure atomicity and avoid potential issues with concurrent operations.
  // Link source transaction to the paired transfer after both rows exist.
  if (transferid) {
    await repo.update(id, { transferid }, tenantid);
    if (newTransactions?.[0]) {
      (newTransactions[0] as any).transferid = transferid;
    }
  }

  if (newTransactions) {
    await accountRepo.updateAccountBalance(formTransaction.accountid, formTransaction.amount!, tenantid);

    if (formTransaction.transferaccountid) {
      await accountRepo.updateAccountBalance(formTransaction.transferaccountid, -formTransaction.amount!, tenantid);
    }
  }

  return newTransactions[0];
};

export const updateTransactionHelper = async (
  formTransaction: Updates<TableNames.Transactions>,
  originalData: Transaction,
  session: Session,
  transactionRepo: ITransactionRepository,
  accountRepo: IAccountRepository,
) => {
  let userId = session.user.id;
  let tenantId = session.user.user_metadata.tenantid;

  const currentTimestamp = new Date().toISOString();

  const updatedTransaction: Updates<TableNames.Transactions> = {};
  let updatedTransferTransaction: Updates<TableNames.Transactions> = {};

  let newAccount: { id?: string; amount?: number } = {};
  let newTransferAccount: { id?: string; amount?: number } = {};

  let originalAccount: { id?: string; amount?: number } = {};
  let originalTransferAccount: { id?: string; amount?: number } = {};

  // If nothing is changed return
  //   if (JSON.stringify(formTransaction) === JSON.stringify(originalData)) {
  //     return;
  //   }
  const isUnchanged = Object.keys(formTransaction).every(key => {
    if (key in formTransaction && key in originalData) {
      return formTransaction[key as keyof typeof formTransaction] === originalData[key as keyof typeof originalData];
    }
    return false;
  });
  if (isUnchanged) return; // Exit early if no changes

  // Update trnsactions values
  if (formTransaction.name !== originalData.name) {
    updatedTransaction.name = formTransaction.name;
    if (originalData.transferid) {
      updatedTransferTransaction.name = formTransaction.name;
    }
  }
  if (formTransaction.date !== originalData.date) {
    updatedTransaction.date = formTransaction.date;
    if (originalData.transferid) {
      updatedTransferTransaction.date = formTransaction.date;
    }
  }
  if (formTransaction.payee !== originalData.payee) {
    updatedTransaction.payee = formTransaction.payee;
    if (originalData.transferid) {
      updatedTransferTransaction.payee = formTransaction.payee;
    }
  }
  if (formTransaction.description !== originalData.description) {
    updatedTransaction.description = formTransaction.description;
    if (originalData.transferid) {
      updatedTransferTransaction.description = formTransaction.description;
    }
  }
  if (formTransaction.tags !== originalData.tags) {
    updatedTransaction.tags = formTransaction.tags;
    if (originalData.transferid) {
      updatedTransferTransaction.tags = formTransaction.tags;
    }
  }
  if (formTransaction.notes !== originalData.notes) {
    updatedTransaction.notes = formTransaction.notes;
    if (originalData.transferid) {
      updatedTransferTransaction.notes = formTransaction.notes;
    }
  }
  // if (formTransaction.type !== originalData.type) {
  //   updatedTransaction.type = formTransaction.type;
  //   if (originalData.transferid) {
  //     updatedTransferTransaction.type = formTransaction.type;
  //   }
  // }

  if (formTransaction.categoryid !== originalData.categoryid) {
    updatedTransaction.categoryid = formTransaction.categoryid;
    if (originalData.transferid) {
      updatedTransferTransaction.categoryid = formTransaction.categoryid;
    }
  }

  if (formTransaction.isvoid !== originalData.isvoid) {
    updatedTransaction.isvoid = formTransaction.isvoid;
    if (originalData.transferid) {
      updatedTransferTransaction.isvoid = formTransaction.isvoid;
    }

    //If voided => Remove Amount from Accounts
    if (updatedTransaction.isvoid === true) {
      originalAccount = {
        id: originalData.accountid,
        amount: -originalData.amount,
      };

      if (originalData.transferaccountid) {
        originalTransferAccount = {
          id: originalData.transferaccountid,
          amount: originalData.amount,
        };
      }
    }
    //If Unvoided => Add Amount to Accounts
    if (originalData.isvoid === true && updatedTransaction.isvoid !== false) {
      originalAccount = {
        id: formTransaction.accountid,
        amount: formTransaction.amount,
      };

      if (formTransaction.transferaccountid) {
        originalTransferAccount = {
          id: formTransaction.transferaccountid,
          amount: -formTransaction.amount!,
        };
      }
    }
  }

  if (formTransaction.amount !== originalData.amount) {
    updatedTransaction.amount = formTransaction.amount;
    if (originalData.transferid) {
      updatedTransferTransaction.amount = -formTransaction.amount!;
    }

    // Only set account balance updates if this is the only field changing
    // and if separate account change logic hasn't already set these
    if (
      !updatedTransaction.accountid &&
      !updatedTransaction.transferaccountid &&
      updatedTransaction.isvoid !== false &&
      originalData.isvoid !== false
    ) {
      const amountDiff = formTransaction.amount! - originalData.amount;
      originalAccount = {
        id: originalData.accountid,
        amount: amountDiff,
      };

      if (originalData.transferid && originalData.transferaccountid) {
        originalTransferAccount = {
          id: originalData.transferaccountid,
          amount: -amountDiff,
        };
      }
    }
  }

  // Handle Account Change =>
  // 1. Update Transaction with new AccountId
  // 2. Update TransferTransaction with new TransferAccountId
  // 3. Update OriginalAccount with AccountId and -OriginalAmount
  // 4. Update NewAccount with new AccountId and +FormAmount
  if (formTransaction.accountid !== originalData.accountid) {
    updatedTransaction.accountid = formTransaction.accountid;

    // originalAccount.id = originalData.accountid;
    // newAccount.id = formTransaction.accountid;
    originalAccount = {
      id: originalData.accountid,
      amount: originalData.isvoid === true ? undefined : -parseFloat(originalData.amount.toString()),
    };
    if (updatedTransaction.isvoid !== false) {
      newAccount = {
        id: formTransaction.accountid,
        amount: formTransaction.amount ?? originalData.amount,
      };
    }

    if (originalData.transferid) {
      updatedTransferTransaction.transferaccountid = formTransaction.accountid;
    }
  }

  // Handle Destination Account Change =>
  // 1. Update Transaction with new TransferAccountId
  // 2. Update TransferTransaction with new AccountId
  // 3. Update Original TransferAccount with TransferAccountId and +OriginalAmount
  // 3. Update New TransferAccount with new TransferAccountId and -FormAmount
  if (
    formTransaction.transferaccountid &&
    originalData.transferaccountid &&
    formTransaction.transferaccountid !== originalData.transferaccountid
  ) {
    updatedTransaction.transferaccountid = formTransaction.transferaccountid;
    updatedTransferTransaction.accountid = formTransaction.transferaccountid;

    // originalTransferAccount.id = originalData.transferaccountid;
    // newTransferAccount.id = formTransaction.transferaccountid;

    originalTransferAccount = {
      id: originalData.transferaccountid,
      amount: originalData.isvoid === true ? undefined : originalData.amount,
    };
    if (updatedTransaction.isvoid !== false) {
      newTransferAccount = {
        id: formTransaction.transferaccountid,
        amount: -formTransaction.amount!,
      };
    }
  }

  if (updatedTransaction.amount && updatedTransaction.isvoid !== false && originalData.isvoid !== false) {
    // Account Changed
    if (updatedTransaction.accountid) {
      originalAccount = {
        id: originalData.accountid,
        amount: -originalData.amount,
      };
      newAccount = {
        id: updatedTransaction.accountid,
        amount: updatedTransaction.amount,
      };
    }
    // Transfer Account Changed
    if (updatedTransaction.transferaccountid) {
      if (originalData.transferaccountid) {
        // Revert the original transfer account
        originalTransferAccount = {
          id: originalData.transferaccountid,
          amount: originalData.amount,
        };
      }
      // Update the new transfer account
      newTransferAccount = {
        id: updatedTransaction.transferaccountid,
        amount: -updatedTransaction.amount,
      };
    }

    // Nothing Changed (except possibly amount, which was already handled above)
    if (
      !updatedTransaction.accountid &&
      !updatedTransaction.transferaccountid &&
      formTransaction.amount === undefined
    ) {
      // Only enter here if amount wasn't explicitly changed
      originalAccount = {
        id: originalData.accountid,
        amount: -originalData.amount + (updatedTransaction.amount || originalData.amount), // Adjust the original account
      };
      if (originalData.transferaccountid) {
        originalTransferAccount = {
          id: originalData.transferaccountid,
          amount: originalData.amount - (updatedTransaction.amount || originalData.amount), // Adjust the transfer account
        };
      }
    }
  }

  // Update Transactions
  if (Object.keys(updatedTransaction).length > 0) {
    updatedTransaction.id = originalData.id;
    updatedTransaction.updatedat = currentTimestamp;
    updatedTransaction.updatedby = userId;

    const updatedTransactionRes = await transactionRepo.update(updatedTransaction.id, updatedTransaction, tenantId);
  }
  if (originalData.transferid && Object.keys(updatedTransferTransaction).length > 0) {
    updatedTransferTransaction.id = originalData.transferid;
    updatedTransferTransaction.updatedat = currentTimestamp;
    updatedTransferTransaction.updatedby = userId;

    const updatedTransferTransactionRes = await transactionRepo.update(
      updatedTransferTransaction.id,
      updatedTransferTransaction,
      tenantId,
    );
  }

  try {
    if (newAccount.id && newAccount.amount) {
      await accountRepo.updateAccountBalance(newAccount.id, newAccount.amount, tenantId);
    }
    if (newTransferAccount.id && newTransferAccount.amount) {
      await accountRepo.updateAccountBalance(newTransferAccount.id, newTransferAccount.amount, tenantId);
    }
    if (originalAccount.id && originalAccount.amount) {
      await accountRepo.updateAccountBalance(originalAccount.id, originalAccount.amount, tenantId);
    }
    if (originalTransferAccount.id && originalTransferAccount.amount) {
      await accountRepo.updateAccountBalance(originalTransferAccount.id, originalTransferAccount.amount, tenantId);
    }
  } catch (error) {
    // Rollback or handle the error
    throw new Error("Failed to update account balances");
  }
};
