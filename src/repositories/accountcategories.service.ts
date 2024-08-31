import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountsCategory } from "../lib/supabase";
import { useGetList, useGetOneById } from "./api";
import { useAuth } from "../providers/AuthProvider";
import { TableNames } from "../consts/TableNames";
import {
  updateAccountCategory,
  createAccountCategory,
  deleteAccountCategory,
  restoreAccountCategory,
} from "./accountcategories.api";

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
