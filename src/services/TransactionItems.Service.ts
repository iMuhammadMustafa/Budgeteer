import { useAuth } from "@/src/providers/AuthProvider";
import { resolveTenantId } from "@/src/utils/tenant";
import { queryClient } from "@/src/providers/QueryProvider";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionItem } from "@/src/types/database/Tables.Types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStorageMode } from "../providers/StorageModeProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";
import { queryKeys } from "./queryKeys";

export interface ITransactionItemService extends IService<TransactionItem, TableNames.TransactionItems> {
  useCreateMultiple: () => ReturnType<typeof useMutation<TransactionItem[], Error, { data: Inserts<TableNames.TransactionItems>[] }>>;
  useFindByTransactionId: (transactionId?: string) => ReturnType<typeof useQuery<TransactionItem[]>>;
  useDeleteByTransactionId: () => ReturnType<typeof useMutation<void, Error, string>>;
}

export function useTransactionItemService(): ITransactionItemService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = resolveTenantId(session);
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionItemRepo = dbContext.TransactionItemRepository();

  const useFindByTransactionId = (transactionId?: string) => {
    return useQuery<TransactionItem[]>({
      queryKey: queryKeys.transactionItems.byTransaction(transactionId, tenantId),
      queryFn: async () => {
        if (!transactionId) return [];
        return transactionItemRepo.findByTransactionId(transactionId, tenantId);
      },
      enabled: !!transactionId && !!tenantId,
    });
  };

  const useCreateMultiple = () => {
    return useMutation({
      mutationFn: async ({ data }: { data: Inserts<TableNames.TransactionItems>[] }) => {
        return transactionItemRepo.createMultiple!(data, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactionItems.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.viewAll });
      },
    });
  };

  const useDeleteByTransactionId = () => {
    return useMutation({
      mutationFn: async (transactionId: string) => {
        await transactionItemRepo.deleteByTransactionId(transactionId, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.transactionItems.all });
      },
    });
  };

  return {
    ...createServiceHooks<TransactionItem, TableNames.TransactionItems>(
      TableNames.TransactionItems,
      transactionItemRepo,
      tenantId,
      session,
    ),
    useFindByTransactionId,
    useCreateMultiple,
    useDeleteByTransactionId,
  };
}
