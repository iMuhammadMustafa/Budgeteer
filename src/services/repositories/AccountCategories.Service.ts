import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createAccountCategory,
  deleteAccountCategory,
  getAccountCategoryById,
  getAllAccountCategories,
  restoreAccountCategory,
  updateAccountCategory,
} from "../apis/AccountCategories.repository";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";

export const useGetAccountCategories = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useQuery<AccountCategory[]>({
    queryKey: [TableNames.AccountCategories, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAllAccountCategories(tenantId);
    },
    enabled: !!tenantId,
    // refetchOnMount: true,
    // refetchOnWindowFocus: true,
  });
};

export const useGetAccountCategoryById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<AccountCategory | null>({
    queryKey: [TableNames.AccountCategories, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAccountCategoryById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
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
      formData,
      originalData,
    }: {
      formData: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
      originalData?: AccountCategory;
    }) => {
      if (formData.id && originalData) {
        return await updateAccountCategoryHelper(formData, session);
      }
      return await createAccountCategoryHelper(formData as Inserts<TableNames.AccountCategories>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
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

  formAccountCategory.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
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
  formAccountCategory.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const updatedAccountCategory = await updateAccountCategory(formAccountCategory);

  return updatedAccountCategory;
};
