import { Inserts, Updates, supabase } from "@/src/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { TableNames } from "@/src/consts/TableNames";

export const getAllTransactions = async () => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select("*, account:accounts(*), category:categories(*)")
    // .select("*")
    // .select("*, account:accounts!inner(*), category:categories!inner(*)")
    // .eq("account.isdeleted", false)
    // .eq("category.isdeleted", false)
    .eq("isdeleted", false);
  // .order("date", { ascending: false });

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
export const getTransactionByTransferId = async (id: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select()
    .eq("isdeleted", false)
    .eq("transferid", id)
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
export const updateCategoryTransactionsDelete = async (categoryId: string, session?: Session | null) => {
  const { data: otherId, error: otherError } = await supabase
    .from(TableNames.Categories)
    .select("id")
    .eq("name", "Other")
    .single();

  if (otherError) throw otherError;

  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({ categoryid: otherId.id, updatedat: new Date().toISOString(), updatedby: session?.user?.id })
    .eq("categoryid", categoryId)
    .select();

  if (error) throw error;
  return data;
};
export const deleteAccountTransactions = async (accountId: string, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: true, updatedat: new Date().toISOString(), updatedby: session?.user?.id })
    .eq("accountid", accountId)
    .select();

  if (error) throw error;
  return data;
};
export const restoreAccountTransactions = async (accountId: string, session?: Session | null) => {
  return supabase
    .from(TableNames.Transactions)
    .update({ isdeleted: false, updatedat: new Date().toISOString(), updatedby: session?.user?.email })
    .eq("accountid", accountId);
};
