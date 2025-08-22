import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TransactionGroup, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { createTransactionGroup, ITransactionGroupRepository, updateTransactionGroup } from "@/src/repositories";
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
  if (!tenantId) throw new Error("Tenant ID not found in session");
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const transactionGroupRepo = dbContext.TransactionGroupRepository();

  // Repository-based Transaction Group hooks
  const findAll = () => {
    return useQuery<TransactionGroup[]>({
      queryKey: [TableNames.TransactionGroups, tenantId, "repo"],
      queryFn: async () => {
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

        return transactionGroupRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
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
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        return await transactionGroupRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionGroups] });
      },
    });
  };

  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
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
