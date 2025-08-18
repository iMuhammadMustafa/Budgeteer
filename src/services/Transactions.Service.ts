import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  Transaction,
  Inserts,
  Updates,
  TransactionsView,
  SearchDistinctTransactions,
} from "@/src/types/db/Tables.Types";
import { TableNames, ViewNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { initialSearchFilters } from "@/src/utils/transactions.helper";
import GenerateUuid from "@/src/utils/UUID.Helper";
import dayjs from "dayjs";
import { useStorageMode } from "../providers/StorageModeProvider";
// Legacy imports - these need to be updated to use repositories
import { ITransactionRepository } from "@/src/repositories";
import { IServiceWithView } from "./IService";

export interface ITransactionService
  extends IServiceWithView<
    Transaction,
    Inserts<TableNames.Transactions>,
    Updates<TableNames.Transactions>,
    TransactionsView
  > {
  findAllInfinite: (searchFilters: TransactionFilters) => ReturnType<typeof useInfiniteQuery<TransactionsView[]>>;
  findByName: (text: string) => ReturnType<typeof useQuery<{ label: string; item: SearchDistinctTransactions }[]>>;
  getByTransferId: (id?: string) => ReturnType<typeof useQuery<TransactionsView>>;
  createMultipleTransactionsRepo: () => ReturnType<typeof useMutation<any, Error, Inserts<TableNames.Transactions>[]>>;
  updateTransferTransactionRepo: () => ReturnType<typeof useMutation<any, Error, Updates<TableNames.Transactions>>>;
  findByDate: (date: string) => ReturnType<typeof useQuery<TransactionsView[]>>;
  findByCategory: (categoryId: string, type: "category" | "group") => ReturnType<typeof useQuery<TransactionsView[]>>;
  findByMonth: (month: string) => ReturnType<typeof useQuery<TransactionsView[]>>;
}

export function useTransactionService(): ITransactionService {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const transactionRepo = dbContext.TransactionRepository();

  // Repository-based Transaction hooks
  const findAll = (searchFilters: TransactionFilters) => {
    return useQuery<TransactionsView[]>({
      queryKey: [ViewNames.TransactionsView, searchFilters, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findAll(searchFilters, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<TransactionsView | Transaction | null>({
      queryKey: [TableNames.Transactions, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const findByName = (text: string) => {
    return useQuery<{ label: string; item: any }[]>({
      queryKey: [TableNames.Transactions, "search", text, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findByName(text, tenantId);
      },
      enabled: !!tenantId && !!text,
    });
  };

  const getByTransferId = (id?: string) => {
    return useQuery<TransactionsView>({
      queryKey: [TableNames.Transactions, "transfer", id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.getByTransferId(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (form: Inserts<TableNames.Transactions>) => {
        return await createTransactionHelper(form, session, transactionRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const update = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({ form, original }: { form: Updates<TableNames.Transactions>; original: Transaction }) => {
        await updateTransactionHelper(form, original, session, transactionRepo);
        return original;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const createMultipleTransactionsRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (transactions: Inserts<TableNames.Transactions>[]) => {
        return await transactionRepo.createMultipleTransactions(transactions);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const updateTransferTransactionRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (transaction: Updates<TableNames.Transactions>) => {
        return await transactionRepo.updateTransferTransaction(transaction);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const deleteObj = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const restore = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
    });
  };

  const findByDate = (date: string) => {
    return useQuery<TransactionsView[]>({
      queryKey: [TableNames.Transactions, "byDate", date, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findByDate(date, tenantId);
      },
      enabled: !!tenantId && !!date,
    });
  };

  const findByCategory = (categoryId: string, type: "category" | "group") => {
    return useQuery<TransactionsView[]>({
      queryKey: [TableNames.Transactions, "byCategory", categoryId, type, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findByCategory(categoryId, type, tenantId);
      },
      enabled: !!tenantId && !!categoryId,
    });
  };

  const findByMonth = (month: string) => {
    return useQuery<TransactionsView[]>({
      queryKey: [TableNames.Transactions, "byMonth", month, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionRepo.findByMonth(month, tenantId);
      },
      enabled: !!tenantId && !!month,
    });
  };

  const findAllInfinite = (searchFilters: TransactionFilters) => {
    const normalizedFilters = Object.keys(searchFilters).length !== 0 ? searchFilters : initialSearchFilters;
    return useInfiniteQuery<TransactionsView[]>({
      queryKey: [ViewNames.TransactionsView, normalizedFilters, tenantId, "repo", "infinite"],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }) => {
        if (!tenantId) throw new Error("Tenant ID not found in session for infinite query");

        // For now, we'll use the regular findAll method and implement pagination later
        // This is a simplified implementation - in production you'd want proper pagination
        const allResults = await transactionRepo.findAll(normalizedFilters, tenantId);

        // Simple pagination simulation
        const pageSize = 10;
        const startIndex = (pageParam as number) * pageSize;
        const endIndex = startIndex + pageSize;

        return allResults.slice(startIndex, endIndex);
      },
      enabled: !!tenantId,
      getNextPageParam: (lastPage, allPages) => {
        // If the last page is empty or has fewer items than pageSize, no more pages
        if (lastPage.length === 0 || lastPage.length < 10) return undefined;
        return allPages.length;
      },
    });
  };

  const upsert = (id: string) => {
    if (!id) {
      return create();
    }
    return update();
  };

  return {
    // Repository-based methods (new)
    findAll,
    findAllInfinite,
    findById,
    findByName,
    getByTransferId,
    create,
    update,
    upsert,
    createMultipleTransactionsRepo,
    updateTransferTransactionRepo,
    delete: deleteObj,
    softDelete: deleteObj,
    restore,
    findByDate,
    findByCategory,
    findByMonth,

    repo: transactionRepo,
  };
}

const createTransactionHelper = async (
  formTransaction: Inserts<TableNames.Transactions>,
  session: Session,
  repo: ITransactionRepository,
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

  const newTransactions = await repo.createMultipleTransactions(transactions);

  if (newTransactions) {
    // Account balance updates would need to be handled by the repository or calling code
    // TODO: Use accountRepo.updateAccountBalance(formTransaction.accountid, formTransaction.amount!, tenantid);
    // if (formTransaction.transferaccountid) {
    //   TODO: Use accountRepo.updateAccountBalance(formTransaction.transferaccountid, -formTransaction.amount!, tenantid);
    // }
  }

  return newTransactions[0];
};

export const updateTransactionHelper = async (
  formTransaction: Updates<TableNames.Transactions>,
  originalData: Transaction,
  session: Session,
  transactionRepo: ITransactionRepository,
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
    // Account balance updates would need to be handled by the repository or calling code
    // TODO: Use accountRepo.updateAccountBalance for these calls
    if (newAccount.id && newAccount.amount) {
      // TODO: await accountRepo.updateAccountBalance(newAccount.id, newAccount.amount, tenantId);
    }
    if (newTransferAccount.id && newTransferAccount.amount) {
      // TODO: await accountRepo.updateAccountBalance(newTransferAccount.id, newTransferAccount.amount, tenantId);
    }
    if (originalAccount.id && originalAccount.amount) {
      // TODO: await accountRepo.updateAccountBalance(originalAccount.id, originalAccount.amount, tenantId);
    }
    if (originalTransferAccount.id && originalTransferAccount.amount) {
      // TODO: await accountRepo.updateAccountBalance(originalTransferAccount.id, originalTransferAccount.amount, tenantId);
    }
  } catch (error) {
    // Rollback or handle the error
    throw new Error("Failed to update account balances");
  }
};
