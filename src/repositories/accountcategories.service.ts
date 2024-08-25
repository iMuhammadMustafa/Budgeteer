import { useMutation } from "@tanstack/react-query";
import { AccountsCategories, TableNames, supabase } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";

export const useGetAccountCategories = async () => {
  useGetList<TableNames.AccountCategories>(TableNames.AccountCategories);
};
export const useGetAccountCategoryById = async (id: string) => {
  useGetOneById<TableNames.AccountCategories>(TableNames.AccountCategories, id);
};
export const useUpsertAccountCategory = async (formAccountCategory: AccountsCategories) => {
  useMutation({
    mutationFn: async () => {
      if (formAccountCategory.id) {
        return await updateAccountCategory(formAccountCategory);
      }
      return await createAccountCategory(formAccountCategory);
    },
  });
};
export const useDeleteAccountCategory = async (id: string) => {
  useMutation({
    mutationFn: async () => {
      return await deleteAccountCategory(id);
    },
  });
};
export const useRestoreAccountCategory = async (id: string) => {
  useMutation({
    mutationFn: async () => {
      return await restoreAccountCategory(id);
    },
  });
};
export const createAccountCategory = async (accountCategory: AccountsCategories) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).insert(accountCategory).single();
  if (error) throw error;
  return data;
};
export const updateAccountCategory = async (accountCategory: AccountsCategories) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).update(accountCategory).single();
  if (error) throw error;
  return data;
};
export const deleteAccountCategory = async (id: string) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).delete().eq("id", id).single();
  if (error) throw error;
  return data;
};
export const restoreAccountCategory = async (id: string) => {
  const { data, error } = await supabase
    .from(TableNames.AccountCategories)
    .update({ isdeleted: false })
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};
