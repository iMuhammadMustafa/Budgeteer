import { useMutation, useQuery } from "@tanstack/react-query";
import { AccountsCategory, TableNames, supabase } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../providers/AuthProvider";

export const useGetAccountCategories = () => {
  return useGetList<AccountsCategory>(TableNames.AccountCategories);
};
export const useGetAccountCategoryById = (id: string) => {
  useGetOneById<TableNames.AccountCategories>(TableNames.AccountCategories, id);
};
export const useUpsertAccountCategory = () => {
  return useMutation({
    mutationFn: async (formAccountCategory: AccountsCategory) => {
      if (formAccountCategory.id) {
        return await updateAccountCategory(formAccountCategory);
      }
      return await createAccountCategory(formAccountCategory);
    },
  });
};
export const useDeleteAccountCategory = () => {
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAccountCategory(id, session);
    },
  });
};
export const useRestoreAccountCategory = () => {
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreAccountCategory(id, session);
    },
  });
};
export const createAccountCategory = async (accountCategory: AccountsCategory) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).insert(accountCategory).single();
  if (error) throw error;
  return data;
};
export const updateAccountCategory = async (accountCategory: AccountsCategory) => {
  const { data, error } = await supabase.from(TableNames.AccountCategories).update(accountCategory).single();
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
