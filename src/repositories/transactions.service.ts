import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetOneById } from "./api";
import { Inserts, TableNames, Transaction, Updates, supabase } from "../lib/supabase";

export const useGetTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: [TableNames.Transactions],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Transactions)
        .select(
          "*, account:accounts!transactions_accountid_fkey(*), category:categories!transactions_categoryid_fkey(*)",
        )
        .eq("isdeleted", false)
        .filter("account.isdeleted", "is", false);
      // .not("account.isdeleted", "eq", true);

      if (error) throw new Error(error.message);

      return data;
    },
  });
};

export const useGetTransactionById = (id: string) => {
  return useGetOneById<Transaction>(TableNames.Transactions, id);
};

export const useUpsertTransaction = (formTransaction: Transaction | Updates<TableNames.Transactions>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
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

export const useDeleteTransaction = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await deleteTransaction(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
  });
};
export const useRestoreTransaction = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await restoreTransaction(id);
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
    .single();

  if (error) throw error;
  return data;
};

export const createTransaction = async (transaction: Inserts<TableNames.Transactions>) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...transaction })
    .single();

  if (error) throw error;
  return data;
};
export const deleteTransaction = async (id: string) => {
  return updateTransaction({ id, isdeleted: true });
};
export const restoreTransaction = async (id: string) => {
  return updateTransaction({ id, isdeleted: false });
};
export const deleteAccountTransactions = async (accountId: string) => {
  return supabase.from(TableNames.Transactions).update({ isdeleted: true }).eq("accountid", accountId);
};
export const restoreAccountTransactions = async (accountId: string) => {
  return supabase.from(TableNames.Transactions).update({ isdeleted: false }).eq("accountid", accountId);
};
