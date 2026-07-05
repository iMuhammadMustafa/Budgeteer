/**
 * useEntityList — all data-fetching + CRUD orchestration for an entity list.
 * Extracted from the legacy `useMyTab`; restructured into three namespaced
 * sub-objects (`upsertModal`, `deleteModal`, `restoreModal`) instead of ~19 flat
 * exports. This hook is the only place that knows about IService,
 * dependencyConfig, or TanStack Query — it has no JSX dependency.
 */
import { useCallback, useMemo, useState } from "react";

import { queryClient } from "@/src/providers/QueryProvider";
import { TableNames } from "@/src/types/database/TableNames";
import { Updates } from "@/src/types/database/Tables.Types";
import useBackAction from "@/src/utils/useBackAction";
import { useNotify } from "@/src/components/ui/notifications/context";
import { EntityListState, UseEntityListConfig } from "./types";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const getNestedValue = (obj: any, path: string) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

export function useEntityList<TModel, TTable extends TableNames>({
  service,
  queryKey,
  groupBy,
  showDeleted,
  dependencyConfig,
  customFindAll,
}: UseEntityListConfig<TModel, TTable>): EntityListState<TModel> {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const isSelectionMode = selectedItems.length > 0;
  const { notify } = useNotify();

  // Android back / web Escape exits selection mode.
  const clearSelection = useCallback(() => setSelectedItems([]), []);
  useBackAction(isSelectionMode, clearSelection);

  const findAllQuery = customFindAll ? customFindAll() : service.useFindAll();
  const findAllDeletedQuery = service.useFindAllDeleted();
  const { data, isLoading, error } = showDeleted ? findAllDeletedQuery : findAllQuery;

  const { mutateAsync: softDeleteAsync } = service.useSoftDelete();
  const { mutateAsync: hardDeleteAsync } = service.useHardDelete();
  const { mutate: updateMultipleMutate } = dependencyConfig?.dependencyService?.useUpdateMultiple?.() ?? {
    mutate: () => {},
  };
  const { mutate: softDeleteDependencies } = dependencyConfig?.dependencyService?.useSoftDelete?.() ?? {
    mutate: () => {},
  };
  const { mutate: hardDeleteDependencies } = dependencyConfig?.dependencyService?.useHardDelete?.() ?? {
    mutate: () => {},
  };

  // Restore pages (showDeleted) operate on the hard-delete lifecycle.
  const deleteAsync = showDeleted ? hardDeleteAsync : softDeleteAsync;
  const deleteDependencies = showDeleted ? hardDeleteDependencies : softDeleteDependencies;

  // ---- upsert modal ----
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<TModel | undefined>(undefined);
  const openUpsert = useCallback((item?: TModel) => {
    setCurrentItem(item);
    setUpsertOpen(true);
  }, []);
  const closeUpsert = useCallback(() => setUpsertOpen(false), []);

  // ---- delete modal ----
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const openDelete = useCallback((item: TModel) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  }, []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);

  // ---- restore modal ----
  const { mutate: restoreMutate, isPending: isRestorePending } = service.useRestore();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<any>(null);
  const openRestore = useCallback((item: TModel) => {
    setItemToRestore(item);
    setRestoreOpen(true);
  }, []);
  const closeRestore = useCallback(() => setRestoreOpen(false), []);

  const handleRestoreConfirm = useCallback(() => {
    if (!itemToRestore) return;
    restoreMutate({ id: itemToRestore.id, item: itemToRestore });
    setItemToRestore(null);
    setRestoreOpen(false);
  }, [itemToRestore, restoreMutate]);

  // ---- dependencies (for dependency-aware delete) ----
  const { data: dependencyData } = dependencyConfig?.dependencyService?.useFindAll?.() ?? { data: [] };

  const dependencies = useMemo(() => {
    if (!dependencyConfig || !dependencyData || !itemToDelete) return [];
    return (dependencyData as any[]).filter((dep: any) => dep[dependencyConfig.dependencyField] === itemToDelete.id);
  }, [dependencyConfig, dependencyData, itemToDelete]);

  const dependencyCount = dependencies.length;

  const replacementItems = useMemo(() => {
    if (!data || !itemToDelete) return [];
    return (data as any[]).filter((item: any) => item.id !== itemToDelete.id);
  }, [data, itemToDelete]);

  const groupedData: Record<string, TModel[]> = useMemo(() => {
    if (!groupBy) return { "": (data as TModel[]) || [] };
    if (!data) return {};
    return (data as any[]).reduce(
      (acc, item) => {
        const groupValue = getNestedValue(item, groupBy) || "Uncategorized";
        (acc[groupValue] = acc[groupValue] || []).push(item);
        return acc;
      },
      {} as Record<string, TModel[]>,
    );
  }, [data, groupBy]);

  const isSelected = useCallback((item: any) => selectedItems.some(s => s.id === item.id), [selectedItems]);

  const handleLongPress = useCallback((item: any) => {
    setSelectedItems(prev => (prev.some(i => i.id === item.id) ? prev : [...prev, item]));
  }, []);

  const handlePress = useCallback(
    (item: any) => {
      if (isSelectionMode) {
        setSelectedItems(prev =>
          prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item],
        );
      } else {
        openUpsert(item);
      }
    },
    [isSelectionMode, openUpsert],
  );

  // Bulk delete: aggregate failures instead of firing-and-forgetting per item.
  const handleBulkDelete = useCallback(async () => {
    if (!isSelectionMode || selectedItems.length === 0) return;
    const items = selectedItems;
    setSelectedItems([]);
    const results = await Promise.allSettled(items.map(item => deleteAsync({ id: item.id, item })));
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (rejected.length > 0) {
      console.warn(`[entity-list] bulk delete: ${rejected.length}/${items.length} item(s) failed to delete`);
      notify({
        type: "error",
        message:
          rejected.length === 1
            ? errorMessage(rejected[0].reason, "One item couldn't be deleted.")
            : `${rejected.length} of ${items.length} items couldn't be deleted.`,
      });
    }
  }, [isSelectionMode, selectedItems, deleteAsync, notify]);

  const handleDeleteConfirm = useCallback(
    async (replacementItemId?: string, alsoDeleteDependencies?: boolean) => {
      if (!itemToDelete) return;
      const target = itemToDelete;

      // A delete can be rejected by the service (e.g. a reserved/system category);
      // surface it without leaving an unhandled rejection.
      const runDelete = async () => {
        try {
          await deleteAsync({ id: target.id, item: target });
        } catch (err) {
          console.warn(`[entity-list] delete of "${target.name ?? target.id}" was blocked:`, err);
          notify({ type: "error", message: errorMessage(err, `“${target.name ?? "This item"}” couldn't be deleted.`) });
        } finally {
          setItemToDelete(null);
        }
      };

      if (dependencyCount > 0 && !alsoDeleteDependencies && replacementItemId && dependencyConfig) {
        const updates: Updates<any>[] = dependencies.map((dep: any) => ({
          id: dep.id,
          [dependencyConfig.dependencyField]: replacementItemId,
        }));
        if (dependencyConfig.onBeforeUpdate) {
          await dependencyConfig.onBeforeUpdate(dependencies, target.id, replacementItemId);
        }
        updateMultipleMutate(updates as any, {
          onSuccess: async () => {
            if (dependencyConfig.onAfterUpdate) {
              await dependencyConfig.onAfterUpdate(dependencies, target.id, replacementItemId);
            }
            await runDelete();
          },
        });
      } else if (alsoDeleteDependencies && dependencyCount > 0) {
        dependencies.forEach((dep: any) => deleteDependencies({ id: dep.id, item: dep }));
        await runDelete();
      } else {
        await runDelete();
      }
    },
    [
      itemToDelete,
      dependencyCount,
      dependencies,
      dependencyConfig,
      updateMultipleMutate,
      deleteAsync,
      deleteDependencies,
      notify,
    ],
  );

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryKey]);

  return {
    groupedData,
    isLoading,
    error,
    isSelectionMode,
    selectedItems,
    isSelected,
    handleLongPress,
    handlePress,
    handleBulkDelete,
    handleRefresh,
    upsertModal: {
      isOpen: upsertOpen,
      currentItem,
      open: openUpsert,
      close: closeUpsert,
    },
    deleteModal: {
      isOpen: deleteOpen,
      itemToDelete,
      open: openDelete,
      close: closeDelete,
      handleConfirm: handleDeleteConfirm,
      dependencyCount,
      replacementItems,
    },
    restoreModal: {
      isOpen: restoreOpen,
      itemToRestore,
      open: openRestore,
      close: closeRestore,
      handleConfirm: handleRestoreConfirm,
      isPending: isRestorePending,
    },
  };
}
