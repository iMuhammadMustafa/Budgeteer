import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Transaction, Inserts, Updates, TransactionsView } from "@/src/types/db/Tables.Types";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import {
  createMultipleTransactions,
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactions,
  getTransactionsByName,
  restoreTransaction,
  updateTransaction,
} from "../apis/Transactions.api";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { updateAccountBalance } from "../apis/Accounts.api";
import GenerateUuid from "@/src/utils/UUID.Helper";
import dayjs from "dayjs";
import { initialSearchFilters } from "@/src/utils/transactions.helper";

export const useGetAllTransactions = () => {
  return useQuery<TransactionsView[]>({
    queryKey: [TableNames.Transactions],
    queryFn: getAllTransactions,
  });
};
export const useGetTransactions = (searchFilters: TransactionFilters) => {
  return useQuery<TransactionsView[]>({
    queryKey: [ViewNames.TransactionsView, searchFilters],
    queryFn: async () => getTransactions(searchFilters),
  });
};
export const useGetTransactionsInfinite = (searchParams: TransactionFilters) => {
  searchParams = Object.keys(searchParams).length !== 0 ? searchParams : initialSearchFilters;
  return useInfiniteQuery<TransactionsView[]>({
    queryKey: [ViewNames.TransactionsView], // Include searchParams in the query key
    initialPageParam: 0, // Start with page 0
    queryFn: async ({ pageParam = 0 }) => {
      // Calculate the range for the current page
      const pageSize = 10; // Number of items per page
      const startIndex = (pageParam as number) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      // Fetch transactions for the current page
      return getTransactions({
        ...searchParams,
        startIndex,
        endIndex,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page is empty, there are no more pages
      if (lastPage.length === 0) return undefined;

      // Return the next page number
      return allPages.length;
    },
  });
};

export const useGetTransactionById = (id?: string) => {
  return useQuery<Transaction>({
    queryKey: [TableNames.Transactions, id],
    queryFn: async () => getTransactionById(id!),
    enabled: !!id,
  });
};
export const useSearchTransactionsByName = (text: string) => {
  return useQuery<any[]>({
    queryKey: [ViewNames.SearchDistinctTransactions + text],
    queryFn: async () => getTransactionsByName(text),
    enabled: !!text,
  });
};

export const useCreateTransaction = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (transaction: Inserts<TableNames.Transactions>) => {
      return await createTransactionHelper(transaction, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
    },
  });
};
export const useUpdateTransaction = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      accountGroup,
      originalData,
    }: {
      accountGroup: Updates<TableNames.Transactions>;
      originalData: Transaction;
    }) => {
      return await updateTransactionHelper(accountGroup, originalData, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
    },
  });
};

export const useUpsertTransaction = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formTransaction,
      originalData,
    }: {
      formTransaction: Inserts<TableNames.Transactions> | Updates<TableNames.Transactions>;
      originalData?: Transaction;
    }) => {
      if (formTransaction.id && originalData) {
        return await updateTransactionHelper(formTransaction, originalData, session);
      }
      return await createTransactionHelper(formTransaction as Inserts<TableNames.Transactions>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteTransaction = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTransaction(id, userId);

      if (res.transferid) {
        await deleteTransaction(res.transferid, userId);
      }
      if (!res.isvoid) {
        await updateAccountBalance(res.accountid, -res.amount);
        if (res.transferaccountid) {
          await updateAccountBalance(res.transferaccountid, res.amount);
        }
      }
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
    },
  });
};
export const useRestoreTransaction = (id?: string) => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTransaction(id, userId);

      if (res.transferid) {
        await deleteTransaction(res.transferid, userId);
      }
      if (!res.isvoid) {
        await updateAccountBalance(res.accountid, res.amount);
        if (res.transferaccountid) {
          await updateAccountBalance(res.transferaccountid, -res.amount);
        }
      }
      return res;
    },
    onSuccess: async id => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] })]);
    },
  });
};

const createTransactionHelper = async (formTransaction: Inserts<TableNames.Transactions>, session: Session) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;
  const transactions: Inserts<TableNames.Transactions>[] = [];

  const id = GenerateUuid();
  const transferid = formTransaction.type === "Transfer" ? GenerateUuid() : undefined;

  formTransaction.id = id;
  formTransaction.transferid = transferid;
  formTransaction.createdat = new Date().toISOString();
  formTransaction.createdby = userId;
  formTransaction.tenantid = tenantid;

  transactions.push(formTransaction);

  if (formTransaction.transferid && formTransaction.transferaccountid) {
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

  const newTransactions = await createMultipleTransactions(transactions);

  if (newTransactions) {
    let resp = await updateAccountBalance(formTransaction.accountid, formTransaction.amount!);

    if (resp.error) {
      throw resp.error;
    }

    if (formTransaction.transferaccountid) {
      resp = await updateAccountBalance(formTransaction.transferaccountid, -formTransaction.amount!);
    }
    if (resp.error) {
      throw resp.error;
    }
  }

  return newTransactions[0];
};

export const updateTransactionHelper = async (
  formTransaction: Updates<TableNames.Transactions>,
  originalData: Transaction,
  session: Session,
) => {
  let userId = session.user.id;

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
    if (updatedTransaction.isvoid) {
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
    if (originalData.isvoid && !updatedTransaction.isvoid) {
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
      amount: originalData.isvoid ? undefined : -originalData.amount,
    };
    if (!updatedTransaction.isvoid) {
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
      amount: originalData.isvoid ? undefined : originalData.amount,
    };
    if (!updatedTransaction.isvoid) {
      newTransferAccount = {
        id: formTransaction.transferaccountid,
        amount: -formTransaction.amount!,
      };
    }
  }

  if (updatedTransaction.amount && !updatedTransaction.isvoid && !originalData.isvoid) {
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

    // Nothing Changed
    if (!updatedTransaction.accountid && !updatedTransaction.transferaccountid) {
      originalAccount = {
        id: originalData.accountid,
        amount: -originalData.amount + updatedTransaction.amount, // Adjust the original account
      };
      if (originalData.transferaccountid) {
        originalTransferAccount = {
          id: originalData.transferaccountid,
          amount: originalData.amount - updatedTransaction.amount, // Adjust the transfer account
        };
      }
    }
  }

  // Update Transactions
  if (Object.keys(updatedTransaction).length > 0) {
    updatedTransaction.id = originalData.id;
    updatedTransaction.updatedat = currentTimestamp;
    updatedTransaction.updatedby = userId;

    const updatedTransactionRes = await updateTransaction(updatedTransaction);
  }
  if (originalData.transferid && Object.keys(updatedTransferTransaction).length > 0) {
    updatedTransferTransaction.id = originalData.transferid;
    updatedTransferTransaction.updatedat = currentTimestamp;
    updatedTransferTransaction.updatedby = userId;

    const updatedTransferTransactionRes = await updateTransaction(updatedTransferTransaction);
  }

  try {
    if (newAccount.id && newAccount.amount) {
      const resp = await updateAccountBalance(newAccount.id, newAccount.amount);
    }
    if (newTransferAccount.id && newTransferAccount.amount) {
      const resp = await updateAccountBalance(newTransferAccount.id, newTransferAccount.amount);
    }
    if (originalAccount.id && originalAccount.amount) {
      const resp = await updateAccountBalance(originalAccount.id, originalAccount.amount);
    }
    if (originalTransferAccount.id && originalTransferAccount.amount) {
      const resp = await updateAccountBalance(originalTransferAccount.id, originalTransferAccount.amount);
    }
  } catch (error) {
    // Rollback or handle the error
    throw new Error("Failed to update account balances");
  }
};
