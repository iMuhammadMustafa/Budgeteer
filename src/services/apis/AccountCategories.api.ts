import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllAccountCategories = async (tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .order("displayorder", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return data;
};

export const getAccountCategoryById = async (id: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("id", id)
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
      updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
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
    .update({ isdeleted: false, updatedby: userId, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
