import { useQuery } from "@tanstack/react-query";
import { Account, supabase } from "../lib/supabase";

export const useGetList = <T>(key: string) => {
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

export const useAccountList = () => {
  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("isdeleted", false);
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};

export const fetchAllAccounts = async () => {
  const { data, error } = await supabase.from("accounts").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};

// Similar functions for UserAccounts, Categories, and Transactions
export const fetchAllCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};

// CRUD operations for Account
export const createAccount = async (account: Account) => {
  const { data, error } = await supabase.from("accounts").insert({ ...account, IsDeleted: false });
  if (error) throw error;
  return data;
};

export const updateAccount = async (id: string, updates: Partial<Account>) => {
  const { data, error } = await supabase.from("accounts").update(updates).eq("Id", id);
  if (error) throw error;
  return data;
};

export const deleteAccount = async (id: string) => {
  const { data, error } = await supabase.from("accounts").update({ isdeleted: true }).eq("Id", id);
  if (error) throw error;
  return data;
};
