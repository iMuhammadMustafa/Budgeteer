import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Account,
  DailyTransactionsSummary,
  Inserts,
  MonthlyTransactions,
  supabase,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { FunctionNames, TableNames, transactionsKeys, ViewNames } from "@/src/consts/TableNames";
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
  getThisMonthsTransactionsSummary,
  createTransactions,
} from "./transactions.api";
import { getAccountById, updateAccount, updateAccountBalance, updateAccountBalanceFunction } from "./account.api";
import { SearchableDropdownItem } from "../components/SearchableDropdown";
import { queryClient } from "../providers/QueryProvider";
import { MultiTransactionGroup } from "../consts/Types";

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
export type TransactionFormType = TransactionsView & { amount: number };

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
export const useDailyTransactionsSummaryThisMonth = () => {
  return useQuery<DailyTransactionsSummary[]>({
    queryKey: [ViewNames.DailyTransactionsSummary, "month"],
    queryFn: async () => getThisMonthsTransactionsSummary(),
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
      originalData?: TransactionFormType | null;
      sourceAccount: Account | null;
      destinationAccount: Account | null;
    }) => {
      const currentTimestamp = new Date().toISOString();
      const userId = session!.user.id;

      if (!fullFormTransaction.id || !originalData) {
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
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
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
    mutationFn: async (formTransaction: TransactionsView) => {
      const currentTimestamp = new Date().toISOString();
      const user = session?.user;

      console.log(formTransaction);

      const updatedTransaction = await updateTransaction({
        id: formTransaction.id!,
        isdeleted: true,
        updatedat: currentTimestamp,
        updatedby: user?.id,
      });

      if (!updatedTransaction) {
        throw new Error("Transaction wasn't updated");
      }

      if (formTransaction.status === "None") {
        // console.log("formTransaction", formTransaction);
        // await updateAccount({
        //   id: formTransaction.accountid!,
        //   balance: formTransaction.balance! - formTransaction.amount!,
        //   updatedat: currentTimestamp,
        //   updatedby: user?.id,
        // });
        await supabase.rpc(FunctionNames.UpdateAccountBalance, {
          accountid: formTransaction.accountid!,
          amount: -formTransaction.amount!,
        });
      }

      if (formTransaction.type === "Transfer") {
        if (formTransaction.status === "None") {
          // const transferAccount =
          //   queryClient.getQueryData<Account>([TableNames.Accounts, formTransaction.transferaccountid!]) ??
          //   (await getAccountById(formTransaction.transferaccountid!));

          // await updateAccount({
          //   id: transferAccount.id,
          //   balance: transferAccount.balance + formTransaction.amount!,
          //   updatedat: currentTimestamp,
          //   updatedby: user?.id,
          // });
          await supabase.rpc(FunctionNames.UpdateAccountBalance, {
            accountid: formTransaction.transferaccountid!,
            amount: formTransaction.amount!,
          });
        }

        if (formTransaction.transferid) {
          await updateTransaction({
            id: formTransaction.transferid!,
            isdeleted: true,
            updatedat: currentTimestamp,
            updatedby: user?.id,
          });
        } else {
          const transferTransaction = await getTransactionByTransferId(formTransaction.id!);
          if (transferTransaction) {
            await updateTransaction({
              id: transferTransaction.id!,
              isdeleted: true,
              updatedat: currentTimestamp,
              updatedby: user?.id,
            });
          }
        }
      }

      return;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
  });
};
// export const useRestoreTransaction = (id: string) => {
//   const queryClient = useQueryClient();
//   const { session } = useAuth();
//   return useMutation({
//     mutationFn: async () => {
//       return await restoreTransaction(id, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
//     },
//   });
// };

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
      amount: -amount,
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

      transferid: transferTransaction.transferid,
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

export const handleUpdateTransaction = async (
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
    id: destinationAccount?.id,
    updatedat: currentTimestamp,
    updatedby: userId,
  };

  // If nothing is changed return
  if (JSON.stringify(fullFormTransaction) === JSON.stringify(originalTransaction)) {
    return;
  }

  // Update Transaction's Values
  if (fullFormTransaction.description != originalTransaction.description) {
    updatedTransaction.description = fullFormTransaction.description;
    updatedTransferTransaction.description = fullFormTransaction.description;
  }
  if (fullFormTransaction.notes != originalTransaction.notes) {
    updatedTransaction.notes = fullFormTransaction.notes;
    updatedTransferTransaction.notes = fullFormTransaction.notes;
  }
  if (fullFormTransaction.tags != originalTransaction.tags) {
    updatedTransaction.tags = fullFormTransaction.tags;
    updatedTransferTransaction.tags = fullFormTransaction.tags;
  }
  if (fullFormTransaction.date != originalTransaction.date) {
    updatedTransaction.date = fullFormTransaction.date ?? undefined;
    updatedTransferTransaction.date = fullFormTransaction.date ?? undefined;
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
    updatedTransaction.status = fullFormTransaction.status ?? undefined;
    updatedTransferTransaction.status = fullFormTransaction.status ?? undefined;
  }
  if (fullFormTransaction.type != originalTransaction.type) {
    updatedTransaction.type = fullFormTransaction.type;
    updatedTransferTransaction.type = fullFormTransaction.type;

    // If Type Transfer => Else
    if (originalTransaction.type === "Transfer" && fullFormTransaction.type !== "Transfer") {
      updatedTransaction.transferid = undefined;
      updatedTransaction.transferaccountid = undefined;
      updatedTransferTransaction.isdeleted = true;
    }
    if (originalTransaction.type !== "Transfer" && fullFormTransaction.type === "Transfer") {
      createTransaction({
        description: fullFormTransaction.description,
        amount: updatedTransferTransaction.amount ?? -fullFormTransaction.amount,
        date: fullFormTransaction.date ?? currentTimestamp,
        notes: fullFormTransaction.notes,
        tags: fullFormTransaction.tags,
        status: fullFormTransaction.status ?? "None",
        categoryid: fullFormTransaction.categoryid,
        type: "Transfer",

        accountid: fullFormTransaction.transferaccountid!,
        transferid: originalTransaction.id,
        transferaccountid: fullFormTransaction.accountid,

        createdat: currentTimestamp,
        createdby: userId,
      });
    }
  }

  const getAccountNewBalance = (account: any, oldTransaction: any, newTransaction: any) => {
    const newTransactiomAmount = newTransaction.amount ?? 0;
    let newAccountBalance = account.balance - oldTransaction.amount + newTransactiomAmount;

    // None => Void
    // Remove the new amount and the old amount from the account
    if (oldTransaction.status === "None" && fullFormTransaction.status !== "None") {
      // newAccountBalance -= oldTransaction.amount - newTransactiomAmount;
      newAccountBalance -= newTransactiomAmount;
    }
    // Void => None
    // Add the new amount and the old amount to the account
    if (oldTransaction.status !== "None" && fullFormTransaction.status === "None") {
      // newAccountBalance += oldTransaction.amount - newTransactiomAmount;
      newAccountBalance += oldTransaction.amount;
    }
    // Void => Void
    // Remove the new amount from the account, the old amount already wasn't added
    if (oldTransaction.status !== "None" && fullFormTransaction.status !== "None") {
      newAccountBalance -= newTransactiomAmount + oldTransaction.amount;
    }
    return newAccountBalance;
  };

  // Update Account's Values
  if (fullFormTransaction.accountid == originalTransaction.accountid) {
    updatedAccount.balance = getAccountNewBalance(sourceAccount, originalTransaction, fullFormTransaction);
  } else {
    // If the account has changed
    updatedTransaction.accountid = fullFormTransaction.accountid ?? undefined;
    updatedAccount.id = fullFormTransaction.accountid ?? undefined;

    // If Void => Void
    // Do nothing
    if (fullFormTransaction.status !== "None" && originalTransaction.status !== "None") {
      updatedAccount.id = undefined;
    }
    // If Void => None
    // Add the new amount to the new account, and do nothing to the old account
    if (originalTransaction.status !== "None" && fullFormTransaction.status === "None") {
      updatedAccount.balance = sourceAccount.balance + fullFormTransaction.amount;
    }
    // If None => Void
    // Remove the old amount from the old account, and do nothing to the new account
    if (originalTransaction.status === "None" && fullFormTransaction.status !== "None") {
      updateAccount({
        id: originalTransaction.accountid ?? undefined,
        balance: (originalTransaction.balance ?? 0) - originalTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
    }

    // If None => None
    // Remove the old amount from the old account, and add the new amount to the new account
    if (originalTransaction.status === "None" && fullFormTransaction.status === "None") {
      updatedAccount.balance = sourceAccount.balance + fullFormTransaction.amount;

      updateAccount({
        id: originalTransaction.accountid ?? undefined,
        balance: (originalTransaction.balance ?? 0) - originalTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
    }
  }

  // If it's a transfer
  // If it's the same account
  if (
    (originalTransaction.type === "Transfer" || fullFormTransaction.type === "Transfer") &&
    fullFormTransaction.transferaccountid == originalTransaction.transferaccountid
  ) {
    updatedTransferAccount.balance = getAccountNewBalance(
      destinationAccount!,
      { ...originalTransaction, amount: -originalTransaction.amount },
      { ...fullFormTransaction, amount: -fullFormTransaction.amount },
    );
    //If it's not a transfer anymore
  } else if (
    (originalTransaction.type === "Transfer" && fullFormTransaction.type !== "Transfer") ||
    (originalTransaction.transferaccountid && !fullFormTransaction.transferaccountid)
  ) {
    // If Original status wasn't Void
    // Remove the amount from the account
    updatedTransferAccount.id = undefined;
    if (originalTransaction.status === "None") {
      let destinationAccount = await getAccountById(originalTransaction.transferaccountid!);
      updateAccount({
        id: originalTransaction.transferaccountid!,
        balance: destinationAccount.balance - -originalTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
    }
    // If it's a transfer but wasn't a transfer
  } else if (originalTransaction.type !== "Transfer" && fullFormTransaction.type === "Transfer" && destinationAccount) {
    // If it's a transfer but wasn't a transfer
    // If the new status isn't void
    // Add the amount to the account
    updatedTransferAccount.id = destinationAccount.id;
    if (fullFormTransaction.status === "None") {
      updateAccount({
        id: destinationAccount.id,
        balance: destinationAccount.balance + -fullFormTransaction.amount,
        updatedat: currentTimestamp,
        updatedby: userId,
      });
    }
    // If it's a transfer and the account has changed
    // If the account has changed
  } else {
    if (destinationAccount && fullFormTransaction.transferaccountid) {
      updatedTransferTransaction.accountid = destinationAccount.id;
      updatedTransferAccount.id = destinationAccount.id;

      // If Void => Void
      // Do nothing
      if (fullFormTransaction.status !== "None" && originalTransaction.status !== "None") {
        updatedTransferAccount.id = undefined;
      }
      // If Void => None
      // Add the new amount to the new account, and do nothing to the old account
      if (originalTransaction.status !== "None" && fullFormTransaction.status === "None") {
        updatedTransferAccount.balance = destinationAccount.balance + fullFormTransaction.amount;
      }
      // If None => Void
      // Remove the old amount from the old account, and do nothing to the new account
      if (originalTransaction.status === "None" && fullFormTransaction.status !== "None") {
        console.log("Am I here?");
        let originalDistnationAccount = await getAccountById(originalTransaction.transferaccountid!);
        updateAccount({
          id: originalDistnationAccount.id,
          balance: originalDistnationAccount.balance - -originalTransaction.amount,
          updatedat: currentTimestamp,
          updatedby: userId,
        });
      }

      // If None => None
      // Remove the old amount from the old account, and add the new amount to the new account
      if (originalTransaction.status === "None" && fullFormTransaction.status === "None") {
        updatedTransferAccount.balance = destinationAccount.balance + fullFormTransaction.amount;

        let originalDistnationAccount = await getAccountById(originalTransaction.transferaccountid!);
        updateAccount({
          id: originalDistnationAccount.id,
          balance: originalDistnationAccount.balance - -originalTransaction.amount,
          updatedat: currentTimestamp,
          updatedby: userId,
        });
      }
    }
  }

  updateTransaction(updatedTransaction);
  updateAccount(updatedAccount);
  if (updatedTransferTransaction.id) {
    console.log("updatedTransferTransaction", updatedTransferTransaction);
    updateTransaction(updatedTransferTransaction);
  }
  if (updatedTransferAccount.id) {
    console.log("updatedTransferAccount", updatedTransferAccount);
    updateAccount(updatedTransferAccount);
  }
};

export const useCreateTransactions = () => {
  const queryClient = useQueryClient();
  const { session, isSessionLoading } = useAuth();

  if (!isSessionLoading && (!session || !session.user)) {
    throw new Error("User is not logged in");
  }

  return useMutation({
    mutationFn: async ({
      transactionsGroup,
      totalAmount,
    }: {
      transactionsGroup: MultiTransactionGroup;
      totalAmount: number;
    }) => {
      const currentTimestamp = new Date().toISOString();
      const userId = session!.user.id;

      const transactions: Inserts<TableNames.Transactions>[] = Object.keys(transactionsGroup.transactions).map(key => {
        if (!key) return;
        console.log(transactionsGroup.transactions[key]);
        const transaction: Inserts<TableNames.Transactions> = {
          date: transactionsGroup.date,
          description: transactionsGroup.description,
          type: transactionsGroup.type as any,
          status: transactionsGroup.status,
          accountid: transactionsGroup.accountid,
          createdby: userId,
          createdat: currentTimestamp,
          amount: transactionsGroup.transactions[key].amount,
          categoryid: transactionsGroup.transactions[key].categoryid,
          notes: transactionsGroup.transactions[key].notes,
          tags: transactionsGroup.transactions[key].tags,
          groupid: transactionsGroup.groupid,
        };

        return transaction;
      });

      const createdTransactions = await createTransactions(transactions);

      await updateAccountBalanceFunction(transactionsGroup.accountid, totalAmount);

      if (!createdTransactions) {
        throw new Error("Transaction wasn't created");
      }

      return createdTransactions;
    },
  });
};
