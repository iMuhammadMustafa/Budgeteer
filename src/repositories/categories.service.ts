import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Category, Inserts, supabase, Updates } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { updateCategory, createCategory, deleteCategory, restoreCategory } from "./categories.api";
import { TableNames } from "../consts/TableNames";
import { updateCategoryTransactionsDelete } from "./transactions.api";

export const useGetCategories = () => {
  return useQuery<Category[]>({
    queryKey: [TableNames.Categories],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Categories)
        .select("*")
        .eq("isdeleted", false)
        .order("type");
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
};
export const useGetCategoryById = (id?: string) => {
  return useQuery<Category>({
    queryKey: [TableNames.Categories, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Categories)
        .select()
        .eq("isdeleted", false)
        .eq("id", id!)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
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
      await updateCategoryTransactionsDelete(id, session);

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
