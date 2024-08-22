import { useQuery } from "@tanstack/react-query";
import { Account, Category, supabase, Transaction } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

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

export const getAllTransactions = () => {
  return useQuery<Transaction[]>({
    queryKey: ["Transaction"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "*, account:accounts!transactions_accountid_fkey(*), category:categories!transactions_categoryid_fkey(*), destinationAccount:accounts!transactions_destinationid_fkey(*)",
        )
        .eq("isdeleted", false);
      console.log(data);
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
  });
  if (error) throw error;
  return data;
};
export const upsertAccount = async (account: Account) => {
  const { data, error } = await supabase
    .from("accounts")
    .upsert({
      ...account,
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
  });
  if (error) throw error;
  return data;
};
export const upsertCategory = async (category: Category) => {
  const { data, error } = await supabase.from("categories").upsert(category).select();

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
export const createTransaction = async ({
  transaction,
  srcAccount,
  destAccount,
}: {
  transaction: Transaction;
  srcAccount: Account;
  destAccount?: Account;
}) => {
  const type = transaction.type;

  const amount = type === "Income" ? transaction.amount : -transaction.amount;
  upsertAccount({ ...srcAccount, currentbalance: srcAccount?.currentbalance + amount }); // Balance = Balance + Amount (Income) or Balance - Amount (Expense)

  if (type === "Transfer" && destAccount) {
    upsertAccount({ ...destAccount, currentbalance: destAccount?.currentbalance - amount }); // Balance = Balance - (- Amount) = Balance + Amount
  }

  const { data, error } = await supabase.from("transactions").insert({
    ...transaction,
  });
  if (error) throw error;
  return data;
};
export const upsertTransaction = async (transaction: Transaction) => {
  const { data, error } = await supabase
    .from("transactions")
    .upsert({
      ...transaction,
    })
    .select();

  if (error) throw error;
  return data;
};
export const deleteTransaction = async (id: string) => {
  const { data, error } = await supabase.from("transactions").update({ isdeleted: true }).eq("id", id);
  const transaction = data as Transaction | null;

  if (transaction) {
    const type = transaction.type;
    const { data: account } = useGetOneById<Account>("accounts", transaction.accountid);

    if (account) {
      upsertAccount({ ...account, currentbalance: account?.currentbalance - transaction.amount });
    }
    if (transaction.destinationid) {
      //If transaction.Type === "Transfer"
      const { data: destAccount } = useGetOneById<Account>("accounts", transaction.destinationid);
      if (destAccount) {
        upsertAccount({ ...destAccount, currentbalance: destAccount?.currentbalance + transaction.amount });
      }
    }
  }

  if (error) throw error;
  return data;
};
