import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountsCategory } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { TableNames } from "../consts/TableNames";
import {
  updateAccountCategory,
  createAccountCategory,
  deleteAccountCategory,
  restoreAccountCategory,
  getAllAccountCategories,
  getAccountCategoryById,
} from "./accountcategories.api";

export const useGetAccountCategories = () => {
  return useQuery<AccountsCategory[]>({
    queryKey: [TableNames.AccountCategories],
    queryFn: getAllAccountCategories,
  });
};
export const useGetAccountCategoryById = (id?: string) => {
  return useQuery<AccountsCategory>({
    queryKey: [TableNames.AccountCategories, id],
    queryFn: async () => getAccountCategoryById(id),
    enabled: !!id,
  });
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
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAccountCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
    },
  });
};
export const useRestoreAccountCategory = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreAccountCategory(id, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
    },
  });
};
