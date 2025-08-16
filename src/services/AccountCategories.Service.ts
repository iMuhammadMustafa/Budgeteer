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
} from "@/src/repositories";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { useStorageMode } from "../providers/StorageModeProvider";

export function useAccountCategoryService() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const accountCategoryRepo = dbContext.AccountCategoryRepository();

  const getAccountCategories = () => {
    return useQuery<AccountCategory[]>({
      queryKey: [TableNames.AccountCategories, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountCategoryRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const getAccountCategoryById = (id?: string) => {
    return useQuery<AccountCategory | null>({
      queryKey: [TableNames.AccountCategories, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return accountCategoryRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const createAccountCategory = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (accountCategory: Inserts<TableNames.AccountCategories>) => {
        return await createAccountCategoryRepoHelper(accountCategory, session, accountCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const updateAccountCategory = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        accountCategory,
        originalData,
      }: {
        accountCategory: Updates<TableNames.AccountCategories>;
        originalData: AccountCategory;
      }) => {
        return await updateAccountCategoryRepoHelper(accountCategory, session, accountCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const upsertAccountCategory = () => {
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
          return await updateAccountCategoryRepoHelper(formData, session, accountCategoryRepo);
        }
        return await createAccountCategoryRepoHelper(
          formData as Inserts<TableNames.AccountCategories>,
          session,
          accountCategoryRepo,
        );
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const deleteAccountCategory = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountCategoryRepo.delete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const softDeleteAccountCategory = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountCategoryRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const restoreAccountCategory = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await accountCategoryRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  // Legacy hooks for backward compatibility
  // const getAccountCategoriesLegacy = useGetAccountCategories();
  // const getAccountCategoryByIdLegacy = (id?: string) => useGetAccountCategoryById(id);
  // const createAccountCategoryLegacy = useCreateAccountCategory();
  // const updateAccountCategoryLegacy = useUpdateAccountCategory();
  // const upsertAccountCategoryLegacy = useUpsertAccountCategory();
  // const deleteAccountCategoryLegacy = useDeleteAccountCategory();
  // const restoreAccountCategoryLegacy = useRestoreAccountCategory();

  return {
    // Repository-based Account Categories (new methods)
    getAccountCategories,
    getAccountCategoryById,
    createAccountCategory,
    updateAccountCategory,
    upsertAccountCategory,
    deleteAccountCategory,
    softDeleteAccountCategory,
    restoreAccountCategory,

    // // Legacy Account Categories (for backward compatibility)
    // getAccountCategoriesLegacy,
    // getAccountCategoryByIdLegacy,
    // createAccountCategoryLegacy,
    // updateAccountCategoryLegacy,
    // upsertAccountCategoryLegacy,
    // deleteAccountCategoryLegacy,
    // restoreAccountCategoryLegacy,

    // Direct repository access
    accountCategoryRepo,
  };
}

// export const useGetAccountCategories = () => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   const userId = session?.user?.id;

//   return useQuery<AccountCategory[]>({
//     queryKey: [TableNames.AccountCategories, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getAllAccountCategories(tenantId);
//     },
//     enabled: !!tenantId,
//     // refetchOnMount: true,
//     // refetchOnWindowFocus: true,
//   });
// };

// export const useGetAccountCategoryById = (id?: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<AccountCategory | null>({
//     queryKey: [TableNames.AccountCategories, id, tenantId],
//     queryFn: async () => {
//       if (!id) throw new Error("ID is required");
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getAccountCategoryById(id, tenantId);
//     },
//     enabled: !!id && !!tenantId,
//   });
// };

// export const useCreateAccountCategory = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   return useMutation({
//     mutationFn: async (accountCategory: Inserts<TableNames.AccountCategories>) => {
//       return await createAccountCategoryHelper(accountCategory, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
//     },
//   });
// };
// export const useUpdateAccountCategory = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       accountCategory,
//       originalData,
//     }: {
//       accountCategory: Updates<TableNames.AccountCategories>;
//       originalData: AccountCategory;
//     }) => {
//       return await updateAccountCategoryHelper(accountCategory, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
//     },
//   });
// };

// export const useUpsertAccountCategory = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       formData,
//       originalData,
//     }: {
//       formData: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
//       originalData?: AccountCategory;
//     }) => {
//       if (formData.id && originalData) {
//         return await updateAccountCategoryHelper(formData, session);
//       }
//       return await createAccountCategoryHelper(formData as Inserts<TableNames.AccountCategories>, session);
//     },
//     onSuccess: async (_, data) => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
//     },
//     onError: (error, variables, context) => {
//       throw new Error(JSON.stringify(error));
//     },
//   });
// };

// export const useDeleteAccountCategory = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await deleteAccountCategory(id, userId);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
//     },
//   });
// };

// export const useRestoreAccountCategory = (id?: string) => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await restoreAccountCategory(id, userId);
//     },
//     onSuccess: async id => {
//       await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] })]);
//     },
//   });
// };

// const createAccountCategoryHelper = async (
//   formAccountCategory: Inserts<TableNames.AccountCategories>,
//   session: Session,
// ) => {
//   let userId = session.user.id;
//   let tenantid = session.user.user_metadata.tenantid;

//   formAccountCategory.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
//   formAccountCategory.createdby = userId;
//   formAccountCategory.tenantid = tenantid;

//   const newAccountCategory = await createAccountCategory(formAccountCategory);

//   return newAccountCategory;
// };

// const updateAccountCategoryHelper = async (
//   formAccountCategory: Updates<TableNames.AccountCategories>,
//   session: Session,
// ) => {
//   let userId = session.user.id;

//   formAccountCategory.updatedby = userId;
//   formAccountCategory.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

//   const updatedAccountCategory = await updateAccountCategory(formAccountCategory);

//   return updatedAccountCategory;
// };

// Repository-based helper functions
const createAccountCategoryRepoHelper = async (
  formAccountCategory: Inserts<TableNames.AccountCategories>,
  session: Session,
  repository: any,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccountCategory.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formAccountCategory.createdby = userId;
  formAccountCategory.tenantid = tenantid;

  const newAccountCategory = await repository.create(formAccountCategory, tenantid);

  return newAccountCategory;
};

const updateAccountCategoryRepoHelper = async (
  formAccountCategory: Updates<TableNames.AccountCategories>,
  session: Session,
  repository: any,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formAccountCategory.updatedby = userId;
  formAccountCategory.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!formAccountCategory.id) throw new Error("ID is required for update");

  const updatedAccountCategory = await repository.update(formAccountCategory.id, formAccountCategory, tenantid);

  return updatedAccountCategory;
};
