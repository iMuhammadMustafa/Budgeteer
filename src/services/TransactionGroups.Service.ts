import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  createTransactionGroup,
  ITransactionCategoryRepository,
  ITransactionGroupRepository,
  updateTransactionGroup,
} from "@/src/repositories";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { Session } from "@supabase/supabase-js";
import { IService } from "./IService";

export interface ITransactionGroupService
  extends IService<TransactionGroup, Inserts<TableNames.TransactionGroups>, Updates<TableNames.TransactionGroups>> {}

export function useTransactionGroupService(): ITransactionGroupService {
  const { session } = useAuth();

  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const transactionGroupRepo = dbContext.TransactionGroupRepository();

  // Repository-based Transaction Group hooks
  const findAll = () => {
    return useQuery<TransactionGroup[]>({
      queryKey: [TableNames.TransactionGroups, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionGroupRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<TransactionGroup | null>({
      queryKey: [TableNames.TransactionGroups, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return transactionGroupRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (form: Inserts<TableNames.TransactionGroups>) => {
        return await createRepoHelper(form, session, transactionGroupRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      },
    });
  };

  const update = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Updates<TableNames.TransactionGroups>;
        original?: TransactionGroup;
      }) => {
        return await updateRepoHelper(form, session, transactionGroupRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      },
    });
  };

  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;
        original?: TransactionGroup;
      }) => {
        console.log(form);
        if (form.id && original) {
          return await updateRepoHelper(form, session, transactionGroupRepo);
        }
        return await createRepoHelper(form as Inserts<TableNames.TransactionGroups>, session, transactionGroupRepo);
      },
      onSuccess: async (_, data) => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
      onError: (error, variables, context) => {
        throw new Error(JSON.stringify(error));
      },
    });
  };

  const softDelete = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionGroupRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      },
    });
  };

  const restore = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await transactionGroupRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      },
    });
  };
  return {
    // Repository-based methods (new) - using simple method names
    findAll,
    findById,
    create,
    update,
    softDelete,
    delete: softDelete,
    restore,
    upsert,

    // Direct repository access
    repo: transactionGroupRepo,
  };
}

// Repository-based helper functions
const createRepoHelper = async (
  formData: Inserts<TableNames.TransactionGroups>,
  session: Session,
  repository: ITransactionGroupRepository,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formData.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formData.createdby = userId;
  formData.tenantid = tenantid;

  console.log("formData", formData);

  const newEntity = await repository.create(formData, tenantid);
  return newEntity;
};

const updateRepoHelper = async (
  formData: Updates<TableNames.TransactionGroups>,
  session: Session,
  repository: ITransactionGroupRepository,
) => {
  let userId = session.user.id;

  formData.updatedby = userId;
  formData.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!formData.id) throw new Error("ID is required for update");
  const updatedEntity = await repository.update(formData.id, formData);
  return updatedEntity;
};

// Legacy functions for backward compatibility
// export const useGetTransactionGroupsLegacy = () => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<TransactionGroup[]>({
//     queryKey: [TableNames.TransactionGroups, tenantId],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getAllTransactionGroups(tenantId);
//     },
//     enabled: !!tenantId,
//   });
// };

// export const useGetTransactionGroupByIdLegacy = (id?: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<TransactionGroup | null>({
//     queryKey: [TableNames.TransactionGroups, id, tenantId],
//     queryFn: async () => {
//       if (!id) throw new Error("ID is required");
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getTransactionGroupById(id, tenantId);
//     },
//     enabled: !!id && !!tenantId,
//   });
// };

// export const useCreateTransactionGroupLegacy = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   return useMutation({
//     mutationFn: async (accountGroup: Inserts<TableNames.TransactionGroups>) => {
//       return await createTransactionGroupHelper(accountGroup, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
//     },
//   });
// };

// export const useUpdateTransactionGroupLegacy = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       accountGroup,
//       originalData,
//     }: {
//       accountGroup: Updates<TableNames.TransactionGroups>;
//       originalData: TransactionGroup;
//     }) => {
//       return await updateTransactionGroupHelper(accountGroup, session);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
//     },
//   });
// };

// export const useUpsertTransactionGroupLegacy = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   return useMutation({
//     mutationFn: async ({
//       formData,
//       originalData,
//     }: {
//       formData: Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;
//       originalData?: TransactionGroup;
//     }) => {
//       if (formData.id && originalData) {
//         return await updateTransactionGroupHelper(formData, session);
//       }
//       return await createTransactionGroupHelper(formData as Inserts<TableNames.TransactionGroups>, session);
//     },
//     onSuccess: async (_, data) => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
//     },
//     onError: (error, variables, context) => {
//       throw new Error(JSON.stringify(error));
//     },
//   });
// };

// export const useDeleteTransactionGroupLegacy = () => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");

//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await deleteTransactionGroup(id, userId);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
//     },
//   });
// };

// export const useRestoreTransactionGroupLegacy = (id?: string) => {
//   const { session } = useAuth();
//   if (!session) throw new Error("Session not found");
//   const userId = session.user.id;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await restoreTransactionGroup(id, userId);
//     },
//     onSuccess: async id => {
//       await Promise.all([queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] })]);
//     },
//   });
// };

const createTransactionGroupHelper = async (
  formTransactionGroup: Inserts<TableNames.TransactionGroups>,
  session: Session,
) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formTransactionGroup.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formTransactionGroup.createdby = userId;
  formTransactionGroup.tenantid = tenantid;

  const newTransactionGroup = await createTransactionGroup(formTransactionGroup);

  return newTransactionGroup;
};

const updateTransactionGroupHelper = async (
  formTransactionGroup: Updates<TableNames.TransactionGroups>,
  session: Session,
) => {
  let userId = session.user.id;

  formTransactionGroup.updatedby = userId;
  formTransactionGroup.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  const updatedTransactionGroup = await updateTransactionGroup(formTransactionGroup);

  return updatedTransactionGroup;
};

// Maintain legacy exports for backward compatibility
// export const useGetTransactionGroups = useGetTransactionGroupsLegacy;
// export const useGetTransactionGroupById = useGetTransactionGroupByIdLegacy;
// export const useCreateTransactionGroup = useCreateTransactionGroupLegacy;
// export const useUpdateTransactionGroup = useUpdateTransactionGroupLegacy;
// export const useUpsertTransactionGroup = useUpsertTransactionGroupLegacy;
// export const useDeleteTransactionGroup = useDeleteTransactionGroupLegacy;
// export const useRestoreTransactionGroup = useRestoreTransactionGroupLegacy;
