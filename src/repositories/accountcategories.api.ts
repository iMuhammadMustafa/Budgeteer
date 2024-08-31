import { TableNames } from "../consts/TableNames";
import { AccountsCategory, supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export const createAccountCategory = async (accountCategory: AccountsCategory) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).insert(accountCategory).select().single();
  if (error) throw error;
  return data;
};
export const updateAccountCategory = async (accountCategory: AccountsCategory) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .update(accountCategory)
    .eq("id", accountCategory.id!)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const deleteAccountCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
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
export const restoreAccountCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
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
