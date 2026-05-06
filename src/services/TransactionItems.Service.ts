import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionItem } from "@/src/types/database/Tables.Types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import { ITransactionItemRepository } from "../repositories/interfaces/ITransactionItemRepository";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface ITransactionItemService extends IService<TransactionItem, TableNames.TransactionItems> {
  useFindByTransactionId: (transactionId?: string) => ReturnType<typeof useQuery<TransactionItem[]>>;
  useSaveItems: () => ReturnType<typeof useMutation<void, Error, { transactionId: string; items: Inserts<TableNames.TransactionItems>[] }>>;
}

export function useTransactionItemService(): ITransactionItemService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const repo = dbContext.TransactionItemRepository() as ITransactionItemRepository;

  const useFindByTransactionId = (transactionId?: string) => {
    return useQuery<TransactionItem[]>({
      queryKey: [TableNames.TransactionItems, "byTransaction", transactionId, tenantId],
      queryFn: async () => {
        if (!transactionId) return [];
        return repo.findByTransactionId(transactionId, tenantId);
      },
      enabled: !!transactionId && !!tenantId,
    });
  };

  const useSaveItems = () => {
    return useMutation<void, Error, { transactionId: string; items: Inserts<TableNames.TransactionItems>[] }>({
      mutationFn: async ({ transactionId, items }) => {
        // Delete existing items for this transaction
        const existing = await repo.findByTransactionId(transactionId, tenantId);
        for (const item of existing) {
          await repo.softDelete(item.id, tenantId);
        }

        // Create new items
        if (items.length > 0) {
          const itemsWithTransaction = items.map(item => ({
            ...item,
            transactionid: transactionId,
          }));
          await repo.createMultiple(itemsWithTransaction, tenantId);
        }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.TransactionItems] });
      },
    });
  };

  return {
    ...createServiceHooks<TransactionItem, TableNames.TransactionItems>(
      TableNames.TransactionItems,
      repo,
      tenantId,
      session,
    ),
    useFindByTransactionId,
    useSaveItems,
  };
}
