import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames, ViewNames } from "@/src/types/database//TableNames";
import { Account, Inserts, Updates } from "@/src/types/database//Tables.Types";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import createServiceHooks from "./BaseService";
import { createAccountRepoHelper, updateAccountRepoHelper } from "./helpers/accounts.helpers";
import { IService } from "./IService";

export interface IAccountService extends IService<Account, TableNames.Accounts> {
  useFindAllWithCategory: (isDeleted?: boolean) => ReturnType<typeof useQuery<Account[]>>;
  useGetTotalAccountsBalance: () => ReturnType<typeof useQuery<{ totalbalance: number } | null>>;
  useGetAccountOpenedTransaction: (id?: string) => ReturnType<typeof useQuery<any>>;
  useUpdateAccountBalance: () => ReturnType<typeof useMutation<number, Error, { accountId: string; amount: number }>>;
  useUpdateAccountOpenedTransaction: () => ReturnType<typeof useMutation<any, Error, { id: string; amount: number }>>;
  useGetAccountRunningBalance: (id?: string) => ReturnType<typeof useQuery<number | null>>;
}

export function useAccountService(): IAccountService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const accountRepo = dbContext.AccountRepository();
  const transactionRepo = dbContext.TransactionRepository();
  const configRepo = dbContext.ConfigurationRepository();

  const useFindAllWithCategory = (isDeleted?: boolean) => {
    return useQuery<Account[]>({
      queryKey: [TableNames.Accounts, "WithCategory", tenantId, isDeleted],
      queryFn: async () => {
        return accountRepo.findAllWithCategory(tenantId, { isDeleted: isDeleted ?? false });
      },
      enabled: !!tenantId,
    });
  };

  const useGetTotalAccountsBalance = () => {
    return useQuery<{ totalbalance: number } | null>({
      queryKey: [TableNames.Accounts, "TotalBalance", tenantId],
      queryFn: async () => {
        return accountRepo.getTotalAccountBalance(tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const useGetAccountOpenedTransaction = (id?: string) => {
    return useQuery<any>({
      queryKey: [TableNames.Transactions, id, tenantId],
      queryFn: async () => {
        return accountRepo.getAccountOpenedTransaction(id!, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const useGetAccountRunningBalance = (id?: string) => {
    return useQuery<number | null>({
      queryKey: [TableNames.Accounts, id, "RunningBalance", tenantId],
      queryFn: async () => {
        const result = await accountRepo.getAccountRunningBalance(id!, tenantId);
        return result?.runningbalance ?? null;
      },
      enabled: !!id && !!tenantId,
    });
  };

  const useUpdateAccountBalance = () => {
    return useMutation({
      mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
        return await accountRepo.updateAccountBalance(accountId, amount, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };
  const useUpdateAccountOpenedTransaction = () => {
    const userId = session?.user.id;

    return useMutation({
      mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
        const transaction: Updates<TableNames.Transactions> = {
          id: id,
          amount: amount,
          updatedby: userId,
          updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
        };
        return await transactionRepo.update(id, transaction, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: async (form: Inserts<TableNames.Accounts>) => {
        return await createAccountRepoHelper(form, session, accountRepo, transactionRepo, configRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
        props: { addAdjustmentTransaction = false } = {},
      }: {
        form: Updates<TableNames.Accounts>;
        original?: Account;
        props?: {
          addAdjustmentTransaction?: boolean;
        };
      }) => {
        return await updateAccountRepoHelper(
          form,
          session,
          original!,
          accountRepo,
          transactionRepo,
          configRepo,
          addAdjustmentTransaction,
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const useUpsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
        props: { addAdjustmentTransaction = false } = {},
      }: {
        form: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
        original?: Account;
        props?: {
          addAdjustmentTransaction?: boolean;
        };
      }) => {
        // Clean up properties that shouldn't be sent to database
        (form as any).category = undefined;
        (form as any).runningbalance = undefined;
        (form as any).addAdjustmentTransaction = undefined;
        (form as any).openBalance = undefined;

        if (form.id && original) {
          return await updateAccountRepoHelper(
            form,
            session,
            original,
            accountRepo,
            transactionRepo,
            configRepo,
            addAdjustmentTransaction,
          );
        }
        return await createAccountRepoHelper(
          form as Inserts<TableNames.Accounts>,
          session,
          accountRepo,
          transactionRepo,
          configRepo,
        );
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, _?.id, "RunningBalance", tenantId] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  return {
    ...createServiceHooks<Account, TableNames.Accounts>(TableNames.Accounts, accountRepo, tenantId, session),
    useCreate,
    useUpdate,
    useUpsert,
    useFindAllWithCategory,
    useGetTotalAccountsBalance,
    useGetAccountOpenedTransaction,
    useUpdateAccountBalance,
    useUpdateAccountOpenedTransaction,
    useGetAccountRunningBalance,
  };
}
