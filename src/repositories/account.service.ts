import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, Inserts, supabase, Updates } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import {
  updateAccount,
  createAccount,
  deleteAccount,
  restoreAccount,
  getAccountById,
  getAllAccounts,
} from "./account.api";
import { TableNames } from "../consts/TableNames";
import { deleteAccountTransactions, restoreAccountTransactions } from "./transactions.api";

export const useGetAccounts = () => {
  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts],
    queryFn: getAllAccounts,
  });
};

export const useGetAccountById = (id?: string) => {
  return useQuery<Account>({
    queryKey: [TableNames.Accounts, id],
    queryFn: async () => getAccountById(id),
    enabled: !!id,
  });
};

export const useUpsertAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth().session || {};

  return useMutation({
    mutationFn: async ({
      formAccount,
      originalData,
    }: {
      formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
      originalData?: Account;
    }) => {
      if (formAccount.id) {
        formAccount.updatedby = user?.id;
        formAccount.updatedat = new Date().toISOString();

        return await updateAccount(formAccount, originalData);
      }
      formAccount.createdby = user?.id;
      formAccount.createdat = new Date().toISOString();
      return await createAccount(formAccount as Inserts<TableNames.Accounts>);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      await queryClient.invalidateQueries({
        queryKey: [TableNames.Accounts, data.formAccount.id ?? data.originalData?.id],
      });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteAccount = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteAccountTransactions(id, session);
      return await deleteAccount(id, session);
    },
    onSuccess: async (_, id) => {
      await Promise.all([
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] }),
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
      ]);
    },
  });
};

export const useRestoreAccount = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const [_, accountRes] = await Promise.all([restoreAccountTransactions(id, session), restoreAccount(id, session)]);
      return accountRes;
    },
    onSuccess: async id => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
      ]);
    },
  });
};
