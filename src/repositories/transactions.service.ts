import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetOneById } from "./api";
import { Inserts, TableNames, Transaction, Updates, supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../providers/AuthProvider";

export const useGetTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => getAllTransactions(),
  });
};

export const useGetTransactionById = (id?: string) => {
  return useQuery<Transaction>({
    queryKey: [TableNames.Transactions, id],
    queryFn: async () => getTransactionById(id!),
    enabled: !!id,
  });
};

export const useUpsertTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth().session || {};

  return useMutation({
    mutationFn: async (formTransaction: Transaction | Updates<TableNames.Transactions>) => {
      if (formTransaction.id) {
        formTransaction.updatedby = user?.id;
        formTransaction.updatedat = new Date().toISOString();
        return await updateTransaction(formTransaction);
      }
      formTransaction.createdby = user?.id;
      formTransaction.createdat = new Date().toISOString();
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

export const getAllTransactions = async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, account:accounts(*), category:categories(*)")
    // .select("*")
    // .select("*, account:accounts!inner(*), category:categories!inner(*)")
    // .eq("account.isdeleted", false)
    // .eq("category.isdeleted", false)
    .eq("isdeleted", false);

  if (error) throw new Error(error.message);

  return data;
};

export const getTransactionById = async (id: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select()
    .eq("isdeleted", false)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  const { data, error } = await supabase.from(TableNames.Transactions).insert(transaction).select().single();

  if (error) throw error;
  return data;
};
export const updateTransaction = async (transaction: Updates<TableNames.Transactions>) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update(transaction)
    .eq("id", transaction.id!)
    .select()
    .single();

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
