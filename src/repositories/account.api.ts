import { TableNames } from "../consts/TableNames";
import { Inserts, supabase, Updates } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export const getAllAccounts = async () => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .select("*, category:accountscategories!accounts_categoryid_fkey(*)")
    .eq("isdeleted", false);
  if (error) throw new Error(error.message);
  return data;
};
export const getAccountById = async (id?: string) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .select()
    .eq("isdeleted", false)
    .eq("id", id!)
    .single();
  if (error) throw new Error(error.message);
  return data;
};
export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  const { data, error } = await supabase.from(TableNames.Accounts).insert(account).select().single();

  if (error) throw error;
  return data;
};

export const updateAccount = async (account: Updates<TableNames.Accounts>, session?: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ ...account, updatedby: session?.user.id ?? account.createdby })
    .eq("id", account.id!)
    .select()
    .single();

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