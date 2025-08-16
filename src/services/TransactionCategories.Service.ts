import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createTransactionCategory,
  deleteTransactionCategory,
  getTransactionCategoryById,
  getAllTransactionCategories,
  restoreTransactionCategory,
  updateTransactionCategory,
} from "@/src/repositories";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { useStorageMode } from "../providers/StorageModeProvider";

export function useTransactionCategoryService() {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const transactionCategoryRepo = dbContext.TransactionCategoryRepository();

  // Repository-based TransactionCategory hooks
  const findAllTransactionCategories = () => {
    return useQuery<TransactionCategory[]>({
      queryKey: [TableNames.TransactionCategories, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionCategoryRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findTransactionCategoryById = (id?: string) => {
    return useQuery<TransactionCategory | null>({
      queryKey: [TableNames.TransactionCategories, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionCategoryRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const createTransactionCategoryRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (transactionCategory: Inserts<TableNames.TransactionCategories>) => {
        return await createTransactionCategoryRepoHelper(transactionCategory, session, transactionCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const updateTransactionCategoryRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        transactionCategory,
        originalData,
      }: {
        transactionCategory: Updates<TableNames.TransactionCategories>;
        originalData: TransactionCategory;
      }) => {
        return await updateTransactionCategoryRepoHelper(transactionCategory, session, transactionCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const upsertTransactionCategoryRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        formData,
        originalData,
      }: {
        formData: Inserts<TableNames.TransactionCategories> | Updates<TableNames.TransactionCategories>;
        originalData?: TransactionCategory;
      }) => {
        if (formData.id && originalData) {
          return await updateTransactionCategoryRepoHelper(formData, session, transactionCategoryRepo);
        }
        return await createTransactionCategoryRepoHelper(
          formData as Inserts<TableNames.TransactionCategories>,
          session,
          transactionCategoryRepo,
        );
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const deleteTransactionCategoryRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionCategoryRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const restoreTransactionCategoryRepo = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionCategoryRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  // Legacy hooks for backward compatibility
  const getTransactionCategories = useGetTransactionCategories();
  const getTransactionCategoryById = (id?: string) => useGetTransactionCategoryById(id);
  const createTransactionCategory = useCreateTransactionCategory();
  const updateTransactionCategory = useUpdateTransactionCategory();
  const upsertTransactionCategory = useUpsertTransactionCategory();
  const deleteTransactionCategory = useDeleteTransactionCategory();
  const restoreTransactionCategory = useRestoreTransactionCategory();

  return {
    // Repository-based methods (new)
    findAllTransactionCategories,
    findTransactionCategoryById,
    createTransactionCategoryRepo,
    updateTransactionCategoryRepo,
    upsertTransactionCategoryRepo,
    deleteTransactionCategoryRepo,
    restoreTransactionCategoryRepo,

    // Legacy methods (backward compatibility)
    getTransactionCategories,
    getTransactionCategoryById,
    createTransactionCategory,
    updateTransactionCategory,
    upsertTransactionCategory,
    deleteTransactionCategory,
    restoreTransactionCategory,

    // Direct repository access
    transactionCategoryRepo,
  };
}

export const useGetTransactionCategories = () => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<TransactionCategory[]>({
    queryKey: [TableNames.TransactionCategories, tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getAllTransactionCategories(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useGetTransactionCategoryById = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<TransactionCategory | null>({
    queryKey: [TableNames.TransactionCategories, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getTransactionCategoryById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateTransactionCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  return useMutation({
    mutationFn: async (accountCategory: Inserts<TableNames.TransactionCategories>) => {
      return await createTransactionCategoryHelper(accountCategory, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
    },
  });
};
export const useUpdateTransactionCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      accountCategory,
      originalData,
    }: {
      accountCategory: Updates<TableNames.TransactionCategories>;
      originalData: TransactionCategory;
    }) => {
      return await updateTransactionCategoryHelper(accountCategory, session);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
    },
  });
};

export const useUpsertTransactionCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  return useMutation({
    mutationFn: async ({
      formData,
      originalData,
    }: {
      formData: Inserts<TableNames.TransactionCategories> | Updates<TableNames.TransactionCategories>;
      originalData?: TransactionCategory;
    }) => {
      if (formData.id && originalData) {
        return await updateTransactionCategoryHelper(formData, session);
      }
      return await createTransactionCategoryHelper(formData as Inserts<TableNames.TransactionCategories>, session);
    },
    onSuccess: async (_, data) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
    },
    onError: (error, variables, context) => {
      throw new Error(JSON.stringify(error));
    },
  });
};

export const useDeleteTransactionCategory = () => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteTransactionCategory(id, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
    },
  });
};

export const useRestoreTransactionCategory = (id?: string) => {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const userId = session.user.id;

  return useMutation({
    mutationFn: async (id: string) => {
      return await restoreTransactionCategory(id, userId);
    },
    onSuccess: async id => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] })]);
    },
  });
};

const createTransactionCategoryHelper = async (
  formTransactionCategory: Inserts<TableNames.TransactionCategories>,
  session: Session,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formTransactionCategory.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formTransactionCategory.createdby = userId;
  formTransactionCategory.tenantid = tenantid;

  const newTransactionCategory = await createTransactionCategory(formTransactionCategory);

  return newTransactionCategory;
};

const updateTransactionCategoryHelper = async (
  formTransactionCategory: Updates<TableNames.TransactionCategories>,
  session: Session,
) => {
  let userId = session.user.id;

  formTransactionCategory.updatedby = userId;
  formTransactionCategory.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const updatedTransactionCategory = await updateTransactionCategory(formTransactionCategory);

  return updatedTransactionCategory;
};

// Repository-based helper functions
const createTransactionCategoryRepoHelper = async (
  formTransactionCategory: Inserts<TableNames.TransactionCategories>,
  session: Session,
  repository: any,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formTransactionCategory.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formTransactionCategory.createdby = userId;
  formTransactionCategory.tenantid = tenantid;

  const newTransactionCategory = await repository.create(formTransactionCategory, tenantid);

  return newTransactionCategory;
};

const updateTransactionCategoryRepoHelper = async (
  formTransactionCategory: Updates<TableNames.TransactionCategories>,
  session: Session,
  repository: any,
) => {
  let userId = session.user.id;

  formTransactionCategory.updatedby = userId;
  formTransactionCategory.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!formTransactionCategory.id) throw new Error("ID is required for update");

  const updatedTransactionCategory = await repository.update(formTransactionCategory.id, formTransactionCategory);

  return updatedTransactionCategory;
};
