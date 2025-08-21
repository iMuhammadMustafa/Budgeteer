import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { Session } from "@supabase/supabase-js";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { IService } from "./IService";

export interface IAccountCategoryService
  extends IService<AccountCategory, Inserts<TableNames.AccountCategories>, Updates<TableNames.AccountCategories>> {}

export function useAccountCategoryService(): IAccountCategoryService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const accountCategoryRepo = dbContext.AccountCategoryRepository();

  const findAll = () => {
    return useQuery<AccountCategory[]>({
      queryKey: [TableNames.AccountCategories, tenantId, "repo"],
      queryFn: async () => {
        return accountCategoryRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<AccountCategory | null>({
      queryKey: [TableNames.AccountCategories, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        return accountCategoryRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    return useMutation({
      mutationFn: async (accountCategory: Inserts<TableNames.AccountCategories>) => {
        return await createAccountCategoryRepoHelper(accountCategory, session, accountCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const update = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Updates<TableNames.AccountCategories>;
        original?: AccountCategory;
      }) => {
        return await updateAccountCategoryRepoHelper(form, session, accountCategoryRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
        original?: AccountCategory;
      }) => {
        if (form.id && original) {
          return await updateAccountCategoryRepoHelper(form, session, accountCategoryRepo);
        }
        return await createAccountCategoryRepoHelper(
          form as Inserts<TableNames.AccountCategories>,
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

  const deleteObj = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await accountCategoryRepo.delete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const softDelete = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await accountCategoryRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await accountCategoryRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.AccountCategories] });
      },
    });
  };

  return {
    findAll,
    findById,
    create,
    update,
    upsert,
    delete: deleteObj,
    softDelete,
    restore,
    repo: accountCategoryRepo,
  };
}

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
