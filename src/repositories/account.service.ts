import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, supabase, TableNames, Updates } from "../lib/supabase";
import { createTransaction, deleteAccountTransactions, restoreAccountTransactions } from "./transactions.service";

export const useGetAccounts = () => {
  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Accounts)
        .select("*, category:categories!accounts_categoryid_fkey(*)")
        .eq("isdeleted", false);
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useGetAccountById = (id: string) => {
  return useQuery<Account>({
    queryKey: [TableNames.Accounts, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Accounts)
        .select()
        .eq("isdeleted", false)
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
};

export const useUpsertAccount = (formAccount: Account | Updates<TableNames.Accounts>, originalData?: Account) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (formAccount.id) {
        return await createAccount(formAccount as Account);
      }

      return await updateAccount(formAccount as Updates<TableNames.Accounts>, originalData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, formAccount.id] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};

export const useDeleteAccount = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deleteAccountTransactions(id);
      return await deleteAccount(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};

export const useRestoreAccount = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [_, accountRes] = await Promise.all([restoreAccountTransactions(id), restoreAccount(id)]);
      return accountRes;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] }),
      ]);
    },
  });
};

export const createAccount = async (account: Account) => {
  const { data, error } = await supabase.from(TableNames.Accounts).insert(account).single();

  const { error: transactionError } = await createTransaction({
    amount: account.balance,
    accountid: account.id,
    type: "Initial",
    description: "Account Opened",
    createdby: account.createdby,
    date: account.createdat,
  });

  if (error || transactionError) throw error;
  return data;
};

export const updateAccount = async (account: Updates<TableNames.Accounts>, originalData?: Account) => {
  const { data, error } = await supabase.from(TableNames.Accounts).update(account).single();

  if (originalData && account.balance && account.balance !== originalData.balance) {
    await createTransaction({
      amount: account.balance - originalData.balance,
      accountid: originalData.id,
      type: "Adjustment",
      description: "Balance Adjustment",
      createdby: originalData.createdby,
      date: account.createdat!,
    });
  }

  if (error) throw error;
  return data;
};

export const deleteAccount = async (id: string) => {
  const { data, error } = await supabase.from(TableNames.Accounts).update({ isdeleted: true }).eq("id", id);
  if (error) throw error;
  return data;
};

export const restoreAccount = async (id: string) => {
  const { data, error } = await supabase.from(TableNames.Accounts).update({ isdeleted: false }).eq("id", id);
  if (error) throw error;
  return data;
};
