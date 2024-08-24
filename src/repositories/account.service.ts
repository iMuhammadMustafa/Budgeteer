import { useQuery } from "@tanstack/react-query";
import { Account, Category, supabase, Transaction } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { createTransaction } from "./api";

export const fetchAllAccounts = async () => {
  const { data, error } = await supabase.from("accounts").select("*").eq("isdeleted", false);
  if (error) throw error;
  return data;
};
export const getAccountById = async (id: string) => {
  return useQuery<Account>({
    queryKey: ["account", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select().eq("isdeleted", false).eq("id", id);
      if (error) throw new Error(error.message);
      return data[0];
    },
  });
};

export const createAccount = async (account: Account, user: User) => {
  const { data, error } = await supabase.from("accounts").insert({
    ...account,
    createdby: user.id,
    createdat: new Date(Date.now()).toISOString(),
    isdeleted: false,
  });
  if (error) throw error;
  return data;
};
export const upsertAccount = async (account: Account, user: User) => {
  const { data, error } = await supabase
    .from("accounts")
    .upsert({
      ...account,
      updatedby: user.id,
      updatedat: new Date(Date.now()).toISOString(),
    })
    .select();

  if (data && account.currentbalance != data[0].currentbalance) {
    await createTransaction({
      amount: account.currentbalance - data[0].currentbalance,
      accountid: data[0].id,
      type: "Transfer",
      destinationaccountid: data[0].id,
      description: "Balance Update",
      createdby: user.id,
      createdat: new Date(Date.now()).toISOString(),
      isdeleted: false,
    });
  }

  if (error) throw error;
  return data;
};
export const deleteAccount = async (id: string) => {
  await supabase.from("transactions").update({ isdeleted: true }).eq("accountid", id).select();
  await supabase.from("transactions").update({ isdeleted: true }).eq("destinationaccountid", id).select();

  return await executeDeleteAccount(id);
};

export const executeDeleteAccount = async (id: string) => {
  const { data, error } = await supabase.from("accounts").update({ isdeleted: true }).eq("id", id);
  if (error) throw error;
  return data;
};
