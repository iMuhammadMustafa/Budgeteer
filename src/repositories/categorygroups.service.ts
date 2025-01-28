import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { CategoryGroup, Inserts, supabase, Updates } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { updateCategoryGroup, createCategoryGroup, deleteCategoryGroup, restoreCategoryGroup } from "./categorygroups.api";
import { TableNames, ViewNames } from "../consts/TableNames";

export const useGetCategoryGroups = () => {
  return useQuery<CategoryGroup[]>({
    queryKey: [TableNames.CategoryGroups],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.CategoryGroups)
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
export const useGetCategoryGroupById = (id?: string) => {
  return useQuery<CategoryGroup>({
    queryKey: [TableNames.CategoryGroups, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TableNames.CategoryGroups)
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
export const useGetCategoryGroups = () => {
  return useQuery<CategoryGroup[]>({
    queryKey: [ViewNames.CategoryGroups],
    queryFn: async () => getCategoryGroups()
  });
};

export const useUpsertCategoryGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth().session || {};
  return useMutation({
    mutationFn: async (formCategoryGroup: Inserts<TableNames.CategoryGroups> | Updates<TableNames.CategoryGroups>) => {
      if (formCategoryGroup.id) {
        formCategoryGroup.updatedby = user?.id;
        formCategoryGroup.updatedat = new Date().toISOString();
        return await updateCategoryGroup(formCategoryGroup);
      }

      formCategoryGroup.createdby = user?.id;
      formCategoryGroup.createdat = new Date().toISOString();
      return await createCategoryGroup(formCategoryGroup as Inserts<TableNames.CategoryGroups>);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.CategoryGroups] });
    },
  });
};
export const useDeleteCategoryGroup = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await updateCategoryGroupTransactionsDelete(id, session);

      return await deleteCategoryGroup(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.CategoryGroups] });
    },
  });
};
export const useRestoreCategoryGroup = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreCategoryGroup(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.CategoryGroups] });
    },
  });
};
