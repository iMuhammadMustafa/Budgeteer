import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { TableNames, Category, Tables, supabase } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";
import { useAuth } from "../providers/AuthProvider";

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
  return useMutation({
    mutationFn: async () => {
      return await deleteCategory(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const useRestoreCategory = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await restoreCategory(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const createCategory = async (category: Category) => {
  const { data, error } = await supabase.from(TableNames.Categories).insert(category).single();
  if (error) throw error;
  return data;
};
export const updateCategory = async (category: Category) => {
  const { data, error } = await supabase.from(TableNames.Categories).update(category).single();
  if (error) throw error;
  return data;
};
export const deleteCategory = async (id: string) => {
  const { data, error } = await supabase.from(TableNames.Categories).delete().eq("id", id).single();
  if (error) throw error;
  return data;
};
export const restoreCategory = async (id: string) => {
  const { data, error } = await supabase.from(TableNames.Categories).update({ isdeleted: false }).eq("id", id).single();
  if (error) throw error;
  return data;
};
