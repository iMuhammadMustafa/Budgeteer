import { FunctionNames, TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .order("category(displayorder)", { ascending: false })
    .order("displayorder", { ascending: false })
    .order("name")
    .order("owner");
  if (error) throw new Error(error.message);
  return data as unknown as Account[];
};

export const getAccountById = async (id: string, tenantId: string): Promise<Account | null> => {
  const { data, error } = await supabase
    .from("view_accounts_with_running_balance" as any)
    .select(`*, category:${TableNames.AccountCategories}!accounts_categoryid_fkey(*)`)
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as Account | null;
};

export const createAccount = async (account: Inserts<TableNames.Accounts>) => {
  const { data, error } = await supabase.from(TableNames.Accounts).insert(account).select().single();

  if (error) throw error;
  return data;
};

export const updateAccount = async (account: Updates<TableNames.Accounts>) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ ...account })
    .eq("id", account.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAccount = async (id: string, userId?: string) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({
      isdeleted: true,
      updatedby: userId ?? undefined,
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const restoreAccount = async (id: string, userId?: string) => {
  const { data, error } = await supabase
    .from(TableNames.Accounts)
    .update({ isdeleted: false, updatedby: userId ?? undefined, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAccountBalance = async (accountid: string, amount: number) => {
  return await supabase.rpc(FunctionNames.UpdateAccountBalance, {
    accountid,
    amount,
  });
};

export const getAccountOpenedTransaction = async (accountid: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.Transactions)
    .select("id, amount")
    .eq("tenantid", tenantId)
    .eq("accountid", accountid)
    .eq("type", "Initial")
    .eq("isdeleted", false)
    .single();

  if (error) throw new Error(error.message);
  return data;
};
