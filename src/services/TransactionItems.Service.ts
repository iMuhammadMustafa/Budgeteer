import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionItem } from "@/src/types/database/Tables.Types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStorageMode } from "../providers/StorageModeProvider";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface ITransactionItemService extends IService<TransactionItem, TableNames.TransactionItems> {
  useFindByTransactionId: (transactionId?: string) => ReturnType<typeof useQuery<TransactionItem[]>>;
  useDeleteByTransactionId: () => ReturnType<typeof useMutation<void, Error, string>>;
}

export function useTransactionItemService(): ITransactionItemService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const transactionItemRepo = dbContext.TransactionItemRepository();

  const useFindByTransactionId = (transactionId?: string) => {
    return useQuery<TransactionItem[]>({
      queryKey: [TableNames.TransactionItems, transactionId, tenantId],
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
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionItems] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [ViewNames.TransactionsView] });
      },
    });
  };

  const useDeleteByTransactionId = () => {
    return useMutation({
      mutationFn: async (transactionId: string) => {
        await transactionItemRepo.deleteByTransactionId(transactionId, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionItems] });
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
