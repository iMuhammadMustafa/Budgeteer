import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Account,
  DailyTransactionsSummary,
  Inserts,
  MonthlyTransactions,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { TableNames, transactionsKeys, ViewNames } from "@/src/consts/TableNames";
import {
  getTransactionById,
  updateTransaction,
  createTransaction,
  deleteTransaction,
  restoreTransaction,
  getAllTransactions,
  getTransactionByTransferId,
  getTransactionsByDescription,
  getMonthlyTransactions,
  getDailyTransactionsSummary,
} from "./transactions.api";
import { getAccountById, updateAccount, updateAccountBalance } from "./account.api";
import { TransactionFormType } from "../components/pages/TransactionForm";
import { SearchableDropdownItem } from "../components/SearchableDropdown";
import { queryClient } from "../providers/QueryProvider";

interface CategorizedTransactions {
  categories: {
    expenses: MonthlyTransactions[];
    income: MonthlyTransactions[];
  };
  groups: {
    expenses: Record<string, MonthlyTransactions[]>;
    income: Record<string, MonthlyTransactions[]>;
  };
}

export const useGetTransactions = () => {
  return useQuery<TransactionsView[]>({
    queryKey: [ViewNames.TransactionsView],
    queryFn: getAllTransactions,
  });
};

export const useSearchTransactionsByDescription = (text: string) => {
  const { data, error } = useQuery<SearchableDropdownItem[]>({
    queryKey: [ViewNames.TransactionDistinct + text],
    queryFn: async () => getTransactionsByDescription(text),
    enabled: !!text,
  });

  if (error) throw error;
  return data ?? [];
};

export const useMonthlyTransactions = () => {
  return useQuery<MonthlyTransactions[]>({
    queryKey: [ViewNames.MonthlyTransactions],
    queryFn: async () => getMonthlyTransactions(),
  });
};

export const useDailyTransactionsSummary = () => {
  return useQuery<DailyTransactionsSummary[]>({
    queryKey: [ViewNames.DailyTransactionsSummary],
    queryFn: async () => getDailyTransactionsSummary(),
  });
};

export const useGetTransactionById = (transactionid?: string | null) => {
  return useQuery<TransactionsView>({
    queryKey: [ViewNames.TransactionsView, transactionid],
    queryFn: async () => getTransactionById(transactionid!),
    enabled: !!transactionid,
  });
};

export const useUpsertTransaction = () => {
  const queryClient = useQueryClient();
  const { session, isSessionLoading } = useAuth();

  if (!isSessionLoading && (!session || !session.user)) {
    throw new Error("User is not logged in");
  }

  return useMutation({
    mutationFn: async ({
      fullFormTransaction,
      originalData,
      sourceAccount,
      destinationAccount,
    }: {
      fullFormTransaction: TransactionFormType;
      originalData?: TransactionFormType;
      sourceAccount: Account | null;
      destinationAccount: Account | null;
    }) => {
      const currentTimestamp = new Date().toISOString();
      const userId = session!.user.id;

      if (!fullFormTransaction.id) {
        return await handleNewTransaction(
          fullFormTransaction,
          sourceAccount!,
          destinationAccount,
          currentTimestamp,
          userId,
        );
      }

      return await handleUpdateTransaction(
        fullFormTransaction,
        originalData!,
        sourceAccount!,
        destinationAccount,
        currentTimestamp,
        userId,
      );
    },
    onSuccess: async something => {
      queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView, TableNames.Accounts] });
      await queryClient.invalidateQueries({ queryKey: transactionsKeys.all() });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { session, isSessionLoading } = useAuth();
  if (!isSessionLoading && (!session || !session.user)) {
    throw new Error("No Session or user");
  }
  return useMutation({
    mutationFn: async (formTransaction: Transaction) => {
      const currentTimestamp = new Date().toISOString();
      await updateAccountBalance(formTransaction.accountid, -formTransaction.amount, currentTimestamp, session.user.id);

      if (formTransaction.type === "Transfer") {
        const relatedTransaction = formTransaction.transferid
          ? await getTransactionById(formTransaction.transferid)
          : await getTransactionByTransferId(formTransaction.id);

        await updateAccountBalance(
          relatedTransaction.accountid,
          -relatedTransaction.amount,
          currentTimestamp,
          session.user.id,
        );
        await deleteTransaction(relatedTransaction.id, session);
      }

      return await deleteTransaction(formTransaction.id, session);
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

const handleNewTransaction = async (
  fullFormTransaction: TransactionFormType,
  sourceAccount: Account,
  destinationAccount: Account | null,
  currentTimestamp: string,
  userId: string,
) => {
  let amount = fullFormTransaction.amount;

  if (fullFormTransaction.type === "Expense" || fullFormTransaction.type === "Transfer") amount = -amount;

  const updatedSrcAcc = await updateAccount({
    id: sourceAccount.id,
    balance: sourceAccount.balance + amount,
    updatedat: currentTimestamp,
    updatedby: userId,
  });
  if (!updatedSrcAcc) {
    throw new Error("Source Account wasn't updated");
  }

  // fullFormTransaction as unknown as Inserts<TableNames.Transactions>,
  const createdTransaction = await createTransaction({
    id: undefined,
    accountid: fullFormTransaction.accountid,
    amount: fullFormTransaction.amount,
    categoryid: fullFormTransaction.categoryid,
    date: fullFormTransaction.date,
    description: fullFormTransaction.description,
    // notes: fullFormTransaction.notes,
    status: fullFormTransaction.status,
    tags: fullFormTransaction.tags,
    // tenantid: fullFormTransaction.tenantid,
    transferaccountid: fullFormTransaction.id,

    // transferid: fullFormTransaction.transferid,
    type: fullFormTransaction.type,
    // updatedat: fullFormTransaction.updatedat,
    // updatedby: fullFormTransaction.updatedby,
    // createdby: userId,
  });

  if (!createdTransaction) {
    await updateAccount({
      id: sourceAccount.id,
      balance: sourceAccount.balance - amount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });
    throw new Error("Transaction wasn't created");
  }

  if (fullFormTransaction.type === "Transfer" && destinationAccount) {
    amount = Math.abs(amount);

    const transferTransaction = {
      ...fullFormTransaction,
      id: undefined,
      amount: amount,
      transferid: createdTransaction.id,
      accountid: destinationAccount.id,
    };

    const updatedDestAcc = await updateAccount({
      id: destinationAccount.id,
      balance: destinationAccount.balance + amount,
      updatedat: currentTimestamp,
      updatedby: userId,
    });

    if (!updatedDestAcc) {
      throw new Error("Source Account wasn't updated");
    }

    const createdDestTransaction = await createTransaction({
      id: undefined,
      accountid: transferTransaction.accountid,
      amount: transferTransaction.amount,
      categoryid: transferTransaction.categoryid,
      date: transferTransaction.date,
      description: transferTransaction.description,
      // notes: transferTransaction.notes,
      status: transferTransaction.status,
      tags: transferTransaction.tags,
      // tenantid: transferTransaction.tenantid,
      transferaccountid: transferTransaction.id,

      // transferid: transferTransaction.transferid,
      type: transferTransaction.type,
      // updatedat: transferTransaction.updatedat,
      // updatedby: transferTransaction.updatedby,
      // createdby: userId,
    });
    if (!createdDestTransaction) {
      await updateAccount({
        id: destinationAccount.id,
        balance: destinationAccount.balance - amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
      throw new Error("Transfer Transaction wasn't updated");
    }
  }

  return createdTransaction;
};

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
