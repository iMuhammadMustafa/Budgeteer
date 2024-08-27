import { useQuery } from "@tanstack/react-query";
import { Account, AccountsCategory, Category, supabase, TableNames, Transaction } from "../lib/supabase";

export const useGetList = <T>(key: any) => {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase.from(key).select("*").eq("isdeleted", false);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};

type Table = TableNames.AccountCategories | TableNames.Accounts | TableNames.Categories | TableNames.Transactions;
type GetOneType = Account | Transaction | AccountsCategory | Transaction | Category;

export const useGetOneById = <T>(table: Table, id?: string) => {
  return useQuery<T>({
    queryKey: [table, id],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select().eq("isdeleted", false).eq("id", id!).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
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
