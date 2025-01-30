import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Category, CategoryGroup, Inserts, supabase, Updates } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import {
  updateCategory,
  createCategory,
  deleteCategory,
  restoreCategory,
  getCategoryAndGroups,
} from "../apis/categories.api";
import { TableNames, ViewNames } from "../../consts/TableNames";
import { updateCategoryTransactionsDelete } from "../apis/transactions.api";

export const useGetCategories = () => {
  return useQuery<Category[]>({
    queryKey: [TableNames.Categories],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.Categories)
        .select("*")
        .eq("isdeleted", false)
        .order("type")
        .order("name");
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
// export const useGetCategoryGroups = () => {
//   return useQuery<CategoryGroup[]>({
//     queryKey: [TableNames.categor],
//     queryFn: async () => getCategoryAndGroups(),
//   });
// };

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
      formCategory.tenantid = user?.user_metadata.tenantid;
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
