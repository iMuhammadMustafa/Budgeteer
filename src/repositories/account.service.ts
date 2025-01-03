import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, Inserts, Updates } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import {
  updateAccount,
  createAccount,
  deleteAccount,
  restoreAccount,
  getAccountById,
  getAllAccounts,
  getAccountOpenBalance,
} from "./account.api";
import { TableNames } from "../consts/TableNames";
import { createTransaction, deleteAccountTransactions, restoreAccountTransactions } from "./transactions.api";

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
  const { session } = useAuth();

  if (!session || !session.user) {
    throw new Error("User is not logged in");
  }

  return useMutation({
    mutationFn: async ({
      formAccount,
      originalData,
    }: {
      formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
      originalData?: Account;
    }) => {
      if (formAccount.id) {
        return await upsertUpdateAccount(formAccount, session.user.id, originalData);
      }
      return await upsertCreateAccount(formAccount, session.user.id);
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

const upsertUpdateAccount = async (
  formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>,
  userId: string,
  originalData?: Account,
) => {
  formAccount.updatedby = userId;
  formAccount.updatedat = new Date().toISOString();

  if (originalData && formAccount.balance && formAccount.balance !== originalData.balance) {
    await createTransaction({
      amount: formAccount.balance - originalData.balance,
      accountid: originalData.id,
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      type: "Adjustment",
      description: "Balance Adjustment",
      createdby: originalData.createdby,
      date: new Date().toISOString(),
    });
  }

  return await updateAccount(formAccount);
};
const upsertCreateAccount = async (
  formAccount: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>,
  userId: string,
) => {
  formAccount.createdby = userId;
  formAccount.createdat = new Date().toISOString();

  const newAcc = await createAccount(formAccount as Inserts<TableNames.Accounts>);
  await createTransaction({
    amount: formAccount.balance ?? 0,
    accountid: newAcc.id,
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9", 
    type: "Initial",
    description: "Account Opened",
    createdby: formAccount.createdby!,
    date: formAccount.createdat,
  });

  return newAcc;
};

export const useGetAccountOpenBalance = (id?: string) => {
  return useQuery<any>({
    queryKey: [TableNames.Accounts, id],
    queryFn: async () => getAccountOpenBalance(id),
    enabled: !!id,
  });
};