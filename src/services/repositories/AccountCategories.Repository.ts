import { useMutation, useQuery } from "@tanstack/react-query";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createAccountCategory,
  deleteAccountCategory,
  getAccountCategoryById,
  getAllAccountCategories,
  restoreAccountCategory,
  updateAccountCategory,
} from "../apis/AccountCategories.api";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetAccountCategories = () => {
  return useQuery<AccountCategory[]>({
    queryKey: [TableNames.AccountCategories],
    queryFn: getAllAccountCategories,
  });
};

export const useGetAccountCategoryById = (id?: string) => {
  return useQuery<AccountCategory>({
    queryKey: [TableNames.AccountCategories, id],
    queryFn: async () => getAccountCategoryById(id!),
    enabled: !!id,
  });
};

export const useCreateAccountCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (accountCategory: Inserts<TableNames.AccountCategories>) => {
      return await createAccountCategoryHelper(accountCategory, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
    },
  });
};
export const useUpdateAccountCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      accountCategory,
      originalData,
    }: {
      accountCategory: Updates<TableNames.AccountCategories>;
      originalData: AccountCategory;
    }) => {
      return await updateAccountCategoryHelper(accountCategory, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
    },
  });
};

export const useUpsertAccountCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formAccountCategory,
      originalData,
    }: {
      formAccountCategory: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
      originalData?: AccountCategory;
    }) => {
      if (formAccountCategory.id && originalData) {
        return await updateAccountCategoryHelper(formAccountCategory, session);
      }
      return await createAccountCategoryHelper(formAccountCategory as Inserts<TableNames.AccountCategories>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteAccountCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteAccountCategory(id, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
    },
  });
};

export const useRestoreAccountCategory = (id?: string) => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreAccountCategory(id, userId);
    },
    onSuccess: async id => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] })]);
    },
  });
};

const createAccountCategoryHelper = async (
  formAccountCategory: Inserts<TableNames.AccountCategories>,
  session: Session,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccountCategory.createdat = new Date().toISOString();
  formAccountCategory.createdby = userId;
  formAccountCategory.tenantid = tenantid;

  const newAccountCategory = await createAccountCategory(formAccountCategory);

  return newAccountCategory;
};

const updateAccountCategoryHelper = async (
  formAccountCategory: Updates<TableNames.AccountCategories>,
  session: Session,
) => {
  let userId = session.user.id;

  formAccountCategory.updatedby = userId;
  formAccountCategory.updatedat = new Date().toISOString();

  const updatedAccountCategory = await updateAccountCategory(formAccountCategory);

  return updatedAccountCategory;
};
