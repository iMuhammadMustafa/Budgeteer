import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { TableNames, Category, supabase, Inserts, Updates } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";
import { useAuth } from "../providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetCategories = () => {
  return useGetList<Category>(TableNames.Categories);
};
export const useGetCategoryById = (id?: string) => {
  return useGetOneById<Category>(TableNames.Categories, id);
};
export const useUpsertCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth().session || {};
  return useMutation({
    mutationFn: async (formCategory: Inserts<TableNames.Categories> | Updates<TableNames.Categories>) => {
      if (formCategory.id) {
        formCategory.updatedby = user?.id;
        formCategory.updatedat = new Date().toISOString();
        return await updateCategory(formCategory);
      }

      formCategory.createdby = user?.id;
      formCategory.createdat = new Date().toISOString();
      return await createCategory(formCategory as Inserts<TableNames.Categories>);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const useDeleteCategory = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const useRestoreCategory = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Categories] });
    },
  });
};
export const createCategory = async (category: Inserts<TableNames.Categories>) => {
  const { data, error } = await supabase.from(TableNames.Categories).insert(category).select().single();
  if (error) throw error;
  return data;
};
export const updateCategory = async (category: Updates<TableNames.Categories>) => {
  const { data, error } = await supabase
    .from(TableNames.Categories)
    .update(category)
    .eq("id", category.id!)
    .select()
    .single();
  if (error) throw error;
  return data;
};
export const deleteCategory = async (id: string, session: Session | null) => {
  console.log("deleteCategory", id);
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
