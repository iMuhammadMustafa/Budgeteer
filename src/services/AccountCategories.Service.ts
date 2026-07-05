import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { resolveTenantId } from "@/src/utils/tenant";
import { TableNames } from "@/src/types/database//TableNames";
import { AccountCategory } from "@/src/types/database//Tables.Types";
import { useAuth } from "../providers/AuthProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface IAccountCategoryService extends IService<AccountCategory, TableNames.AccountCategories> {}

export function useAccountCategoryService(): IAccountCategoryService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = resolveTenantId(session);
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const accountCategoryRepo = dbContext.AccountCategoryRepository();

  return createServiceHooks<AccountCategory, TableNames.AccountCategories>(
    TableNames.AccountCategories,
    accountCategoryRepo,
    tenantId,
    session,
  );
}
