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
import createServiceHooks from "./BaseService";
import { createTransactionHelper, updateTransactionHelper } from "./helpers/transactions.helpers";
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
export interface ITransactionService extends IService<Transaction, TableNames.Transactions> {
  useFindAllView: (searchFilters?: TransactionFilters) => ReturnType<typeof useQuery<TransactionsView[]>>;
  useFindAllInfinite: (searchFilters: TransactionFilters) => ReturnType<typeof useInfiniteQuery<TransactionsView[]>>;
  useFindDeleted: (searchFilters: TransactionFilters) => ReturnType<typeof useInfiniteQuery<Transaction[]>>;
  useFindByName: (text: string) => Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  useGetByTransferId: (id?: string) => ReturnType<typeof useQuery<TransactionsView>>;
  useCreateMultipleTransactions: () => ReturnType<typeof useMutation<any, Error, Inserts<TableNames.Transactions>[]>>;
  useUpdateTransferTransaction: () => ReturnType<typeof useMutation<any, Error, Updates<TableNames.Transactions>>>;
  useUpdateMultipleTransactions: () => ReturnType<typeof useMutation<void, Error, BatchUpdateParams>>;
  useSplitTransaction: () => ReturnType<
    typeof useMutation<any, Error, { original: TransactionsView; children: Inserts<TableNames.Transactions>[] }>
  >;
  useFindSplitChildren: (splitFromId?: string) => ReturnType<typeof useQuery<Transaction[]>>;
}

export function useTransactionService(): ITransactionService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionRepo = dbContext.TransactionRepository();
  const accountRepo = dbContext.AccountRepository();
  const transactionItemRepo = dbContext.TransactionItemRepository();

  const useFindAllView = (searchFilters?: TransactionFilters) => {
    return useQuery<TransactionsView[]>({
      queryKey: [ViewNames.TransactionsView, searchFilters, tenantId],
      queryFn: async () => {
        return transactionRepo.findAllFromView(tenantId, searchFilters ?? {});
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

        const res = await transactionRepo.findAllFromView(tenantId, {
          ...normalizedFilters,
          offset,
          limit,
        });
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
        // Cascade soft-delete transaction items
        await transactionItemRepo.deleteByTransactionId(id, tenantId);
        await transactionRepo.softDelete(id, tenantId);
        if (!item) return;
        if (item.isvoid !== true && item.accountid && item.amount) {
          await accountRepo.updateAccountBalance(item.accountid, -item.amount, tenantId);
        }
        if (item.transferid) {
          await transactionItemRepo.deleteByTransactionId(item.transferid, tenantId);
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
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionItems] });
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
  const useUpdateMultipleTransactions = () => {
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

        // 3. Handle account balance updates AFTER transactions are updated.
        // Accumulate per-account deltas and apply once per account instead of
        // issuing one write per transaction.
        const deltas = new Map<string, number>();
        const addDelta = (accountId: string | undefined, amount: number) => {
          if (!accountId || !amount) return;
          deltas.set(accountId, (deltas.get(accountId) ?? 0) + amount);
        };

        if (updates.accountid !== undefined) {
          for (const tx of transactions) {
            if (tx.accountid !== updates.accountid && tx.isvoid !== true) {
              // Revert from old account
              addDelta(tx.accountid!, -tx.amount!);
              // Apply to new account
              addDelta(updates.accountid, tx.amount!);
            }
          }
        }

        // Handle void/unvoid balance changes
        if (updates.isvoid !== undefined) {
          for (const tx of transactions) {
            if (tx.isvoid !== updates.isvoid) {
              const balanceChange = updates.isvoid ? -tx.amount! : tx.amount!;
              addDelta(tx.accountid!, balanceChange);
            }
          }
        }

        for (const [accountId, delta] of deltas) {
          if (delta !== 0) {
            await accountRepo.updateAccountBalance(accountId, delta, tenantId);
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

  /**
   * Split a transaction into multiple child transactions.
   * 1. Void the original transaction (reverses its balance impact)
   * 2. Create N new transactions with splitfromid pointing to the original
   * 3. Each child gets its own balance impact applied
   */
  //TODO: What about transfers?
  //TODO: centarlize helpers
  const useSplitTransaction = () => {
    return useMutation({
      mutationFn: async ({
        original,
        children,
      }: {
        original: TransactionsView;
        children: Inserts<TableNames.Transactions>[];
      }) => {
        const userId = session.user.id;

        // 1. Void the original transaction
        await transactionRepo.update(original.id!, { isvoid: true }, tenantId);

        // The parent's sub-items are now orphaned to a voided row. Drop them — the
        // caller is expected to have transferred their values into `children` (e.g.
        // SplitTransactionModal pre-fills children from the items).
        await transactionItemRepo.voidByTransactionId(original.id!, tenantId);

        // 2. Create child transactions with splitfromid. Force isvoid=false so a
        // toggled parent never propagates its void state to fresh children.
        const childTransactions = children.map(child => ({
          ...child,
          id: GenerateUuid(),
          splitfromid: original.id!,
          isvoid: false,
          tenantid: tenantId,
          createdby: userId,
          updatedby: userId,
          createdat: new Date().toISOString(),
        }));

        const created = await transactionRepo.createMultiple!(childTransactions, tenantId);

        // 3. Accumulate balance deltas — reversing the original (voiding removes
        // its balance impact) and applying each child — then apply once per
        // account instead of one write per transaction.
        const deltas = new Map<string, number>();
        const addDelta = (accountId: string | null | undefined, amount: number | null | undefined) => {
          if (!accountId || !amount) return;
          deltas.set(accountId, (deltas.get(accountId) ?? 0) + amount);
        };

        if (original.isvoid !== true && original.amount) {
          addDelta(original.accountid, -original.amount);
        }
        for (const child of created) {
          addDelta(child.accountid, child.amount);
        }

        for (const [accountId, delta] of deltas) {
          if (delta !== 0) {
            await accountRepo.updateAccountBalance(accountId, delta, tenantId);
          }
        }

        return created;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionItems] });
      },
    });
  };

  /**
   * Find all child transactions created from splitting a given transaction
   */
  const useFindSplitChildren = (splitFromId?: string) => {
    return useQuery<Transaction[]>({
      queryKey: [TableNames.Transactions, "split-children", splitFromId, tenantId],
      queryFn: async () => {
        if (!splitFromId) return [];
        return transactionRepo.findBySplitFromId(splitFromId, tenantId);
      },
      enabled: !!splitFromId && !!tenantId,
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
    useUpdateMultipleTransactions,
    useSplitTransaction,
    useFindSplitChildren,
  };
}
