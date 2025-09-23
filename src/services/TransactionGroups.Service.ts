import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database//TableNames";
import { TransactionGroup } from "@/src/types/database//Tables.Types";
import { useAuth } from "../providers/AuthProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface ITransactionGroupService extends IService<TransactionGroup, TableNames.TransactionGroups> {}

export function useTransactionGroupService(): ITransactionGroupService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const TransactionGroupRepo = dbContext.TransactionGroupRepository();

  return createServiceHooks<TransactionGroup, TableNames.TransactionGroups>(
    TableNames.TransactionGroups,
    TransactionGroupRepo,
    tenantId,
    session,
  );
}
