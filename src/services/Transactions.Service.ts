import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import {
  Inserts,
  SearchDistinctTransactions,
  Transaction,
  TransactionsView,
  Updates,
} from "@/src/types/database/Tables.Types";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { Session } from "@supabase/supabase-js";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useStorageMode } from "../providers/StorageModeProvider";
import { IAccountRepository } from "../repositories/interfaces/IAccountRepository";
import { ITransactionRepository } from "../repositories/interfaces/ITransactionRepository";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface BatchUpdateParams {
  transactions: TransactionsView[];
  updates: {
    date?: string;
    accountid?: string;
    categoryid?: string;
    isvoid?: boolean;
  };
}

export interface ITransactionService extends Omit<IService<Transaction, TableNames.Transactions>, 'useUpdateMultiple'> {
  useFindAllView: (searchFilters?: TransactionFilters) => ReturnType<typeof useQuery<TransactionsView[]>>;
  useFindAllInfinite: (searchFilters: TransactionFilters) => ReturnType<typeof useInfiniteQuery<TransactionsView[]>>;
  useFindDeleted: (searchFilters: TransactionFilters) => ReturnType<typeof useInfiniteQuery<Transaction[]>>;
  useFindByName: (text: string) => Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  useGetByTransferId: (id?: string) => ReturnType<typeof useQuery<TransactionsView>>;
  useCreateMultipleTransactions: () => ReturnType<typeof useMutation<any, Error, Inserts<TableNames.Transactions>[]>>;
  useUpdateTransferTransaction: () => ReturnType<typeof useMutation<any, Error, Updates<TableNames.Transactions>>>;
  useUpdateMultiple: () => ReturnType<typeof useMutation<void, Error, BatchUpdateParams>>;
}

export function useTransactionService(): ITransactionService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionRepo = dbContext.TransactionRepository();
  const accountRepo = dbContext.AccountRepository();

  const useFindAllView = (searchFilters?: TransactionFilters) => {
    return useQuery<TransactionsView[]>({
      queryKey: [ViewNames.TransactionsView, searchFilters, tenantId],
      queryFn: async () => {
        const res = transactionRepo.findAll(tenantId, searchFilters);
        return res as Promise<TransactionsView[]>;
      },
      enabled: !!tenantId,
    });
  };

  const useFindByName = (text: string) => {
    return transactionRepo.findByName(text, tenantId);
  };

  const useGetByTransferId = (id?: string) => {
    return useQuery<TransactionsView>({
      queryKey: [TableNames.Transactions, "transfer", id, tenantId],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        return transactionRepo.findByTransferId(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const useCreateMultipleTransactions = () => {
    return useMutation({
      mutationFn: async (transactions: Inserts<TableNames.Transactions>[]) => {
        return await transactionRepo.createMultiple!(transactions, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const useUpdateTransferTransaction = () => {
    return useMutation({
      mutationFn: async (transaction: Updates<TableNames.Transactions>) => {
        return await transactionRepo.updateTransferTransaction(transaction);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const useFindAllInfinite = (searchFilters: TransactionFilters) => {
    const normalizedFilters = Object.keys(searchFilters).length !== 0 ? searchFilters : {};
    const pageSize = 10;
    return useInfiniteQuery<TransactionsView[]>({
      queryKey: [ViewNames.TransactionsView, normalizedFilters, tenantId, "infinite"],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }) => {
        const offset = (pageParam as number) * pageSize;
        const limit = pageSize;

        const res = (await transactionRepo.findAll(tenantId, {
          ...normalizedFilters,
          offset,
          limit,
        })) as TransactionsView[];
        return res;
      },
      enabled: !!tenantId,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.length < pageSize) return undefined;
        return allPages.length;
      },
    });
  };

  const useFindDeleted = (searchFilters: TransactionFilters) => {
    const pageSize = searchFilters.limit ?? 10;
    return useInfiniteQuery<Transaction[]>({
      queryKey: [TableNames.Transactions, "deleted", tenantId, "infinite", pageSize],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }) => {
        const offset = (pageParam as number) * pageSize;
        const limit = pageSize;
        const res = (await transactionRepo.findAllDeleted(tenantId, { offset, limit })) as Transaction[];
        return res;
      },
      enabled: !!tenantId,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.length < pageSize) return undefined;
        return allPages.length;
      },
    });
  };

  const useUpsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.Transactions> | Updates<TableNames.Transactions>;
        original?: Transaction;
      }) => {
        if (form.id && original) {
          if (!original) throw new Error("Original transaction is required for update");
          await updateTransactionHelper(form, original, session, transactionRepo, accountRepo);
          return original;
        }

        return (await createTransactionHelper(
          form as Inserts<TableNames.Transactions>,
          session,
          transactionRepo,
          accountRepo,
        )) as Transaction;
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const useSoftDelete = () => {
    return useMutation({
      mutationFn: async ({ id, item }: { id: string; item?: any }) => {
        await transactionRepo.softDelete(id, tenantId);
        if (!item) return;
        if (item.isvoid !== true && item.accountid && item.amount) {
          await accountRepo.updateAccountBalance(item.accountid, -item.amount, tenantId);
        }
        if (item.transferid) {
          await transactionRepo.softDelete(item.transferid, tenantId);
          if (item.isvoid !== true && item.transferaccountid && item.amount) {
            await accountRepo.updateAccountBalance(item.transferaccountid, item.amount, tenantId);
          }
        }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const useRestore = () => {
    return useMutation({
      mutationFn: async ({ id, item }: { id: string; item?: any }) => {
        await transactionRepo.restore(id, tenantId);
        if (item) {
          if (item.isvoid !== true && item.accountid && item.amount) {
            await accountRepo.updateAccountBalance(item.accountid, item.amount, tenantId);
          }
          if (item.transferid) {
            await transactionRepo.restore(item.transferid, tenantId);
            if (item.isvoid !== true && item.transferaccountid && item.amount) {
              await accountRepo.updateAccountBalance(item.transferaccountid, -item.amount, tenantId);
            }
          }
        }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  // Override useUpdateMultiple with transaction-specific balance handling
  const useUpdateMultiple = () => {
    return useMutation<void, Error, BatchUpdateParams>({
      mutationFn: async ({ transactions, updates }: BatchUpdateParams) => {
        // 1. Build update objects for each transaction
        const updatePayloads: Updates<TableNames.Transactions>[] = transactions.map((tx, index) => {
          const payload: Updates<TableNames.Transactions> = { id: tx.id! };

          // Date with offset to avoid identical timestamps
          if (updates.date !== undefined) {
            payload.date = dayjs(updates.date).add(index, "millisecond").toISOString();
          }

          if (updates.categoryid !== undefined) {
            payload.categoryid = updates.categoryid;
          }

          if (updates.isvoid !== undefined) {
            payload.isvoid = updates.isvoid;
          }

          if (updates.accountid !== undefined) {
            payload.accountid = updates.accountid;
          }

          return payload;
        });

        // 2. Perform the transaction updates FIRST
        await transactionRepo.updateMultiple!(updatePayloads, tenantId);

        // 3. Handle account balance updates AFTER transactions are updated
        if (updates.accountid !== undefined) {
          for (const tx of transactions) {
            if (tx.accountid !== updates.accountid && tx.isvoid !== true) {
              // Revert from old account
              await accountRepo.updateAccountBalance(tx.accountid!, -tx.amount!, tenantId);
              // Apply to new account
              await accountRepo.updateAccountBalance(updates.accountid, tx.amount!, tenantId);
            }
          }
        }

        // Handle void/unvoid balance changes
        if (updates.isvoid !== undefined) {
          for (const tx of transactions) {
            if (tx.isvoid !== updates.isvoid) {
              const balanceChange = updates.isvoid ? -tx.amount! : tx.amount!;
              await accountRepo.updateAccountBalance(tx.accountid!, balanceChange, tenantId);
            }
          }
        }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  return {
    ...createServiceHooks<Transaction, TableNames.Transactions>(
      TableNames.Transactions,
      transactionRepo,
      tenantId,
      session,
      {
        customCreate: async (form: Inserts<TableNames.Transactions>, session: Session) => {
          return (await createTransactionHelper(form, session, transactionRepo, accountRepo)) as Transaction;
        },
        customUpdate: async (form: Updates<TableNames.Transactions>, session: Session, original?: Transaction) => {
          if (!original) throw new Error("Original transaction is required for update");
          await updateTransactionHelper(form, original, session, transactionRepo, accountRepo);
          return original;
        },
      },
    ),
    useDelete: useSoftDelete,
    useSoftDelete,
    useUpsert,
    useFindAllView,
    useFindAllInfinite,
    useFindDeleted,
    useFindByName,
    useGetByTransferId,
    useCreateMultipleTransactions,
    useUpdateTransferTransaction,
    useRestore,
    useUpdateMultiple, // Override the base implementation
  };
}

const createTransactionHelper = async (
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
  formTransaction.transferid = transferid;
  formTransaction.createdat = new Date().toISOString();
  formTransaction.createdby = userId;
  formTransaction.tenantid = tenantid;
  formTransaction.updatedby = userId;

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

  const newTransactions = await repo.createMultiple!(transactions, tenantid);

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
