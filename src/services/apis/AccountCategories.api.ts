import { TableNames } from "@/src/types/db/TableNames";
import supabase from "@/src/providers/Supabase";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllAccountCategories = async () => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .select()
    .eq("isdeleted", false)
    .order("displayorder", { ascending: true })
    .order("name")
    .order("owner");
  if (error) throw new Error(error.message);
  return data;
};

export const getAccountCategoryById = async (id?: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .select()
    .eq("isdeleted", false)
    .eq("id", id!)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const createAccountCategory = async (accountCategory: Inserts<TableNames.AccountCategories>) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).insert(accountCategory).select().single();

  if (error) throw error;
  return data;
};

export const updateAccountCategory = async (accountCategory: Updates<TableNames.AccountCategories>) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .update({ ...accountCategory })
    .eq("id", accountCategory.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAccountCategory = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .update({
      isdeleted: true,
      updatedby: userId,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const restoreAccountCategory = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .update({ isdeleted: false, updatedby: userId, updatedat: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
