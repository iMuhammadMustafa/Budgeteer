import { TableNames } from "@/src/types/database//TableNames";
import { resolveTenantId } from "@/src/utils/tenant";
import { TransactionCategory } from "@/src/types/database//Tables.Types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { useStorageMode } from "../providers/StorageModeProvider";
import createServiceHooks from "./BaseService";
import { isSystemCategoryId } from "./helpers/systemCategories";
import { IService } from "./IService";
import { queryKeys } from "./queryKeys";

/** Thrown when a user tries to delete a category reserved by the system. */
export const SYSTEM_CATEGORY_DELETE_MESSAGE =
  "This category is used for account operations and can't be deleted. Remap it in Settings → System Categories first.";

export interface ITransactionCategoryService extends IService<TransactionCategory, TableNames.TransactionCategories> {
  useFindAllWithGroup: (isDeleted?: boolean) => ReturnType<typeof useQuery<TransactionCategory[]>>;
}

export function useTransactionCategoryService(): ITransactionCategoryService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = resolveTenantId(session);
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionCategoryRepo = dbContext.TransactionCategoryRepository();
  const configRepo = dbContext.ConfigurationRepository();

  // Guard: reserved (system-mapped) categories must not be deleted, regardless of
  // which entry point (list, detail, bulk) triggers it.
  const guardSystemCategory = async (vars: { id: string }) => {
    if (await isSystemCategoryId(vars.id, tenantId, configRepo)) {
      throw new Error(SYSTEM_CATEGORY_DELETE_MESSAGE);
    }
    return transactionCategoryRepo.softDelete(vars.id, tenantId);
  };

  const useFindAllWithGroup = (isDeleted?: boolean) => {
    return useQuery<TransactionCategory[]>({
      queryKey: queryKeys.transactionCategories.withGroup(tenantId, isDeleted),
      queryFn: async () => {
        return transactionCategoryRepo.findAllWithGroup(tenantId, { isDeleted: isDeleted ?? false });
      },
      enabled: !!tenantId,
    });
  };

  return {
    ...createServiceHooks<TransactionCategory, TableNames.TransactionCategories>(
      TableNames.TransactionCategories,
      transactionCategoryRepo,
      tenantId,
      session,
      {
        customDelete: guardSystemCategory,
        customSoftDelete: guardSystemCategory,
      },
    ),
    useFindAllWithGroup,
  };
}
