import { TableNames } from "@/src/types/db/TableNames";
import dayjs from "dayjs";
import supabase from "@/src/providers/Supabase";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";

export const getAllTransactionGroups = async (tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionGroups)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .order("displayorder", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return data;
};

export const getTransactionGroupById = async (id: string, tenantId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionGroups)
    .select()
    .eq("tenantid", tenantId)
    .eq("isdeleted", false)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const createTransactionGroup = async (transactionGroup: Inserts<TableNames.TransactionGroups>) => {
  const { data, error } = await supabase.from(TableNames.TransactionGroups).insert(transactionGroup).select().single();

  if (error) throw error;
  return data;
};

export const updateTransactionGroup = async (transactionGroup: Updates<TableNames.TransactionGroups>) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionGroups)
    .update({ ...transactionGroup })
    .eq("id", transactionGroup.id!)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTransactionGroup = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionGroups)
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
export const restoreTransactionGroup = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from(TableNames.TransactionGroups)
    .update({ isdeleted: false, updatedby: userId, updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ") })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
