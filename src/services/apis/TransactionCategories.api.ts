import { TableNames } from "@/src/types/db/TableNames";
import supabase from "@/src/providers/Supabase";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllTransactionCategories = async () => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
    .select()
    .eq("isdeleted", false)
    .order("displayorder", { ascending: true })
    .order("name")
    .order("owner");
  if (error) throw new Error(error.message);
  return data;
};

export const getTransactionCategoryById = async (id?: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
    .select()
    .eq("isdeleted", false)
    .eq("id", id!)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const createTransactionCategory = async (transactionCategory: Inserts<TableNames.TransactionCategories>) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
    .insert(transactionCategory)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTransactionCategory = async (transactionCategory: Updates<TableNames.TransactionCategories>) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
    .update({ ...transactionCategory })
    .eq("id", transactionCategory.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTransactionCategory = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
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
export const restoreTransactionCategory = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionCategories)
    .update({ isdeleted: false, updatedby: userId, updatedat: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
