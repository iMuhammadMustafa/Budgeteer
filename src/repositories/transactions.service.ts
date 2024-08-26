import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetOneById } from "./api";
import { Inserts, TableNames, Transaction, Updates, supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../providers/AuthProvider";

export const useGetTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: [TableNames.Transactions],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Transactions)
        .select("*, account:accounts!inner(*), category:categories!inner(*)")
        .eq("account.isdeleted", false)
        .eq("isdeleted", false);

      if (error) throw new Error(error.message);

      return data;
    },
  });
};

export const useGetTransactionById = (id?: string) => {
  return useGetOneById<Transaction>(TableNames.Transactions, id);
};

export const useUpsertTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formTransaction: Transaction | Updates<TableNames.Transactions>) => {
      if (formTransaction.id) {
        return await updateTransaction(formTransaction);
      }
      return await createTransaction(formTransaction as Transaction);
    },
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions, id] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteTransaction(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};
export const useRestoreTransaction = (id: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return await restoreTransaction(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};

export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const { data, error } = await supabase
    .from("transactions")
    .update({ ...transaction })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  const { data, error } = await supabase.from("transactions").insert(transaction).select().single();

  if (error) throw error;
  return data;
};
export const deleteTransaction = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
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
export const restoreTransaction = async (id: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({
      isdeleted: false,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  return data;
};
export const deleteAccountTransactions = async (accountId: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: true, updatedat: new Date().toISOString(), updatedby: session?.user?.id })
    .eq("accountid", accountId)
    .select();

  console.log(data);

  if (error) throw error;
  return data;
};
export const restoreAccountTransactions = async (accountId: string, session?: Session | null) => {
  return supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: false, updatedat: new Date().toISOString(), updatedby: session?.user?.email })
    .eq("accountid", accountId);
};
