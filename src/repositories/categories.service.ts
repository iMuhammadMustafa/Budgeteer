import { useQueryClient, useMutation } from "@tanstack/react-query";
import { TableNames, Category, supabase } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";
import { useAuth } from "../providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetCategories = () => {
  const { session } = useAuth();
  console.log(session);
  return useGetList<TableNames.Categories>(TableNames.Categories);
};
export const useGetCategoryById = (id: string) => {
  return useGetOneById<TableNames.Categories>(TableNames.Categories, id);
};
export const useUpsertCategory = (formCategory: Category) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (formCategory.id) {
        return await updateCategory(formCategory);
      }
      return await createCategory(formCategory);
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.Categories] })]);
    },
  });
};
export const useDeleteCategory = (id: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return await deleteCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const useRestoreCategory = (id: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return await restoreCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const createCategory = async (category: Category) => {
  const { data, error } = await supabase.from(TableNames.Categories).insert(category).select().single();
  if (error) throw error;
  return data;
};
export const updateCategory = async (category: Category) => {
  const { data, error } = await supabase.from(TableNames.Categories).update(category).select().single();
  if (error) throw error;
  return data;
};
export const deleteCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
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
export const restoreCategory = async (id: string, session: Session | null) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
    .update({
      isdeleted: false,
      updatedby: session?.user.id,
      updatedat: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
