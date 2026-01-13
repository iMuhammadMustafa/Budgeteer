import { TableNames } from "@/src/types/database//TableNames";
import { TransactionCategory } from "@/src/types/database//Tables.Types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { useStorageMode } from "../providers/StorageModeProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface ITransactionCategoryService extends IService<TransactionCategory, TableNames.TransactionCategories> {
  useFindAllWithGroup: (isDeleted?: boolean) => ReturnType<typeof useQuery<TransactionCategory[]>>;
}

export function useTransactionCategoryService(): ITransactionCategoryService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionCategoryRepo = dbContext.TransactionCategoryRepository();

  const useFindAllWithGroup = (isDeleted?: boolean) => {
    return useQuery<TransactionCategory[]>({
      queryKey: [TableNames.TransactionCategories, "WithGroup", tenantId, isDeleted],
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
    ),
    useFindAllWithGroup,
  };
}
