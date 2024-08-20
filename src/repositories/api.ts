import { useQuery } from "@tanstack/react-query";
import { Account, Category, supabase, Transaction } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

const { session } = useAuth();

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

export const useGetOneById = <T>(key: any, id: string, table?: string) => {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table ?? key)
        .select()
        .eq("isdeleted", false)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return data[0];
    },
  });
};

export const fetchAllAccounts = async () => {
  const { data, error } = await supabase.from("accounts").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};
export const getAccountById = async (id: string) => {
  const { data, error } = await supabase.from("accounts").select().eq("isdeleted", false).eq("id", id);
  if (error) throw error;
  return data[0];
};
export const createAccount = async (account: Account) => {
  const { data, error } = await supabase.from("accounts").insert({
    ...account,
    isdeleted: false,
    createdat: new Date(Date.now()),
    createdby: session?.user.id,
    updatedat: null,
    updatedby: null,
  });
  if (error) throw error;
  return data;
};
export const upsertAccount = async (account: Account) => {
  const { data, error } = await supabase
    .from("accounts")
    .upsert({
      ...account,
      isdeleted: false,
      createdat: new Date(Date.now()),
      createdby: session?.user.id,
      updatedat: new Date(Date.now()),
      updatedby: session?.user.id,
    })
    .select();

  if (error) throw error;
  return data;
};
export const deleteAccount = async (id: string) => {
  const { data, error } = await supabase.from("accounts").update({ isdeleted: true }).eq("id", id);
  if (error) throw error;
  return data;
};

export const fetchAllCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};
export const getCategoryById = async (id: string) => {
  const { data, error } = await supabase.from("categories").select().eq("isdeleted", false).eq("id", id);
  if (error) throw error;
  return data[0];
};
export const createCategory = async (category: Category) => {
  const { data, error } = await supabase.from("categories").insert({
    ...category,
    isdeleted: false,
    createdat: new Date(Date.now()),
    createdby: session?.user.id,
    updatedat: null,
    updatedby: null,
  });
  if (error) throw error;
  return data;
};
export const upsertCategory = async (category: Category) => {
  const { data, error } = await supabase
    .from("categories")
    .upsert({
      ...category,
      isdeleted: false,
      createdat: new Date(Date.now()),
      createdby: session?.user.id,
      updatedat: new Date(Date.now()),
      updatedby: session?.user.id,
    })
    .select();

  if (error) throw error;
  return data;
};
export const deleteCategory = async (id: string) => {
  const { data, error } = await supabase.from("categories").update({ isdeleted: true }).eq("id", id);
  if (error) throw error;
  return data;
};

export const fetchAllTransactions = async () => {
  const { data, error } = await supabase.from("transactions").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};
export const getTransactionById = async (id: string) => {
  const { data, error } = await supabase.from("transactions").select().eq("isdeleted", false).eq("id", id);
  if (error) throw error;
  return data[0];
};
export const createTransaction = async (transaction: Transaction) => {
  const { data, error } = await supabase.from("transactions").insert({
    ...transaction,
    isdeleted: false,
    createdat: new Date(Date.now()),
    createdby: session?.user.id,
    updatedat: null,
    updatedby: null,
  });
  if (error) throw error;
  return data;
};
export const upsertTransaction = async (transaction: Transaction) => {
  const { data, error } = await supabase
    .from("transactions")
    .upsert({
      ...transaction,
      isdeleted: false,
      createdat: new Date(Date.now()),
      createdby: session?.user.id,
      updatedat: new Date(Date.now()),
      updatedby: session?.user.id,
    })
    .select();

  if (error) throw error;
  return data;
};
export const deleteTransaction = async (id: string) => {
  const { data, error } = await supabase.from("transactions").update({ isdeleted: true }).eq("id", id);
  if (error) throw error;
  return data;
};
