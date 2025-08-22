import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { TransactionCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { useStorageMode } from "../providers/StorageModeProvider";
import { IService } from "./IService";

export interface ITransactionCategoryService
  extends IService<
    TransactionCategory,
    Inserts<TableNames.TransactionCategories>,
    Updates<TableNames.TransactionCategories>
  > {}

export function useTransactionCategoryService(): ITransactionCategoryService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const transactionCategoryRepo = dbContext.TransactionCategoryRepository();

  const findAll = () => {
    return useQuery<TransactionCategory[]>({
      queryKey: [TableNames.TransactionCategories, tenantId, "repo"],
      queryFn: async () => {
        return transactionCategoryRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<TransactionCategory | null>({
      queryKey: [TableNames.TransactionCategories, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");

        return transactionCategoryRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    return useMutation({
      mutationFn: async (transactionCategory: Inserts<TableNames.TransactionCategories>) => {
        return await createTransactionCategoryRepoHelper(transactionCategory, session, transactionCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Updates<TableNames.TransactionCategories>;
        original?: TransactionCategory;
      }) => {
        return await updateTransactionCategoryRepoHelper(form, session, transactionCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.TransactionCategories> | Updates<TableNames.TransactionCategories>;
        original?: TransactionCategory;
      }) => {
        if (form.id && original) {
          return await updateTransactionCategoryRepoHelper(form, session, transactionCategoryRepo);
        }
        return await createTransactionCategoryRepoHelper(
          form as Inserts<TableNames.TransactionCategories>,
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

  const deleteObj = () => {
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        return await transactionCategoryRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await transactionCategoryRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionCategories] });
      },
    });
  };

  return {
    // Repository-based methods (new)
    findAll,
    findById,
    create,
    update,
    upsert,
    delete: deleteObj,
    softDelete: deleteObj,
    restore,
    // Direct repository access
    repo: transactionCategoryRepo,
  };
}

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
