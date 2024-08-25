import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Account, supabase, TableNames, Updates } from "../lib/supabase";
import { createTransaction, deleteAccountTransactions, restoreAccountTransactions } from "./transactions.service";
import { useAuth } from "../providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetAccounts = () => {
  return useQuery<Account[]>({
    queryKey: [TableNames.Accounts],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Accounts)
        .select("*, category:accountscategories!accounts_categoryid_fkey(*)")
        .eq("isdeleted", false);
      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useGetAccountById = (id?: string) => {
  return useQuery<Account>({
    queryKey: [TableNames.Accounts, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Accounts)
        .select()
        .eq("isdeleted", false)
        .eq("id", id!)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
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
      formAccount: Account | Updates<TableNames.Accounts>;
      originalData?: Account;
    }) => {
      formAccount.createdby = user?.id;
      formAccount.createdat = new Date().toISOString();

      if (!formAccount.id) {
        return await createAccount(formAccount as Account);
      }

      formAccount.updatedby = user?.id;
      formAccount.updatedat = new Date().toISOString();

      return await updateAccount(formAccount as Updates<TableNames.Accounts>, originalData);
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
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts, id] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
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

export const createAccount = async (account: Account) => {
  const { data, error } = await supabase.from(TableNames.Accounts).insert(account).select().single();

  if (data) {
    await createTransaction({
      amount: data.balance,
      accountid: data.id,
      type: "Initial",
      description: "Account Opened",
      createdby: data.createdby,
      date: data.createdat,
    });
  }
  if (error) throw error;

  return data;
};

export const updateAccount = async (
  account: Updates<TableNames.Accounts>,
  originalData?: Account,
  session?: Session | null,
) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ ...account, updatedby: session?.user.id ?? account.createdby })
    .eq("id", account.id!)
    .select()
    .single();

  if (originalData && account.balance && account.balance !== originalData.balance) {
    await createTransaction({
      amount: account.balance - originalData.balance,
      accountid: originalData.id,
      type: "Adjustment",
      description: "Balance Adjustment",
      createdby: originalData.createdby,
      date: new Date().toISOString(),
    });
  }

  if (error) throw error;
  return data;
};

export const deleteAccount = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({
      isdeleted: true,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const restoreAccount = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ isdeleted: false, updatedby: session?.user.id, updatedat: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
