import { FunctionNames, TableNames } from "../../consts/TableNames";
import { Inserts, supabase, Updates } from "../../lib/supabase";
import { Session } from "@supabase/supabase-js";

export const getAllAccounts = async () => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .select("*, category:accountscategories!accounts_categoryid_fkey(*)")
    .eq("isdeleted", false)
    .order("category(displayorder)", { ascending: true })
    .order("name")
    .order("owner");
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
export const createAccount = async (account: Inserts<TableNames.Accounts>, session?: Session | null) => {
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
export const updateAccountById = async (account: Updates<TableNames.Accounts>, session?: Session | null) => {
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

export const updateAccountBalance = async (
  accountid: string,
  amount: number,
  currentTimestamp: string,
  userId: string,
) => {
  const accData = await getAccountById(accountid);
  if (!accData) throw new Error("Account is not found");
  return await updateAccount({
    id: accData.id,
    balance: accData.balance + amount,
    updatedat: currentTimestamp,
    updatedby: userId,
  });
};

export const updateAccountBalanceFunction = async (accountid: string, amount: number) => {
  return await supabase.rpc(FunctionNames.UpdateAccountBalance, {
    accountid: accountid!,
    amount: amount,
  });
};

export const getAccountOpenBalance = async (accountid: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select("id, amount")
    .eq("accountid", accountid)
    .eq("type", "Initial")
    .eq("isdeleted", false)
    .single();

  if (error) throw new Error(error.message);
  return data;
};
