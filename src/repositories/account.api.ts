import { TableNames } from "../consts/TableNames";
import { Account, Inserts, supabase, Updates } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { createTransaction } from "./transactions.api";

export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  const { data, error } = await supabase.from(TableNames.Accounts).insert(account).select().single();

  if (data) {
    await createTransaction({
      amount: data.balance,
      accountid: data.id,
      type: "Initial",
      description: "Account Opened",
      createdby: data.createdby,
      date: data.createdat,
    });
  }
  if (error) throw error;

  return data;
};

export const updateAccount = async (
  account: Updates<TableNames.Accounts>,
  originalData?: Account,
  session?: Session | null,
) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ ...account, updatedby: session?.user.id ?? account.createdby })
    .eq("id", account.id!)
    .select()
    .single();

  if (originalData && account.balance && account.balance !== originalData.balance) {
    await createTransaction({
      amount: account.balance - originalData.balance,
      accountid: originalData.id,
      type: "Adjustment",
      description: "Balance Adjustment",
      createdby: originalData.createdby,
      date: new Date().toISOString(),
    });
  }

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
