import { useMutation, useQuery } from "@tanstack/react-query";
import { AccountsCategories, TableNames, supabase } from "../lib/supabase";
import { useGetOneById } from "./api";
import { Session } from "@supabase/supabase-js";
import { useAuth } from "../providers/AuthProvider";

export const useGetAccountCategories = () => {
  return useQuery<AccountsCategories[]>({
    queryKey: [TableNames.AccountCategories],
    queryFn: async () => {
      const { data, error } = await supabase.from(TableNames.AccountCategories).select("*").eq("isdeleted", false);
      if (error) throw new Error(error.message);
      return data;
    },
  });
};
export const useGetAccountCategoryById = (id: string) => {
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
  const { session } = useAuth();
  useMutation({
    mutationFn: async () => {
      return await deleteAccountCategory(id, session);
    },
  });
};
export const useRestoreAccountCategory = async (id: string) => {
  const { session } = useAuth();
  useMutation({
    mutationFn: async () => {
      return await restoreAccountCategory(id, session);
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
