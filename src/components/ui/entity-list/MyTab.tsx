/**
 * MyTab — backward-compatible shim over `useEntityList` + `EntityListScreen` +
 * `EntityListItem`. Keeps the exact prop API of the legacy
 * `src/components/MyTab.tsx` so all existing call sites compile unchanged while
 * the app is migrated. New screens should prefer composing the three pieces
 * directly; this shim is the migration bridge.
 */
import { type ReactNode } from "react";

import ConfirmRestoreModal from "@/src/components/ConfirmRestoreModal";
import DeleteConfirmModal from "@/src/components/elements/DeleteConfirmModal";
import { IService } from "@/src/services/IService";
import { TableNames } from "@/src/types/database/TableNames";
import { EntityListItem } from "./EntityListItem";
import { EntityListScreen } from "./EntityListScreen";
import { DependencyConfig, EntityLike } from "./types";
import { useEntityList } from "./useEntityList";

// Real DB models expose nullable fields (e.g. `name: string | null`) so the shim
// stays unconstrained; items are narrowed to the presentational `EntityLike`
// shape at the render boundary.
type Renderable = EntityLike & Record<string, any>;

/** Derive a singular noun from a plural title, handling common English patterns. */
const singularize = (title: string): string => {
  const words = title.split(" ");
  const last = words.pop()!;
  const singularLast = last.replace(/ies$/i, "y").replace(/s$/i, "");
  return [...words, singularLast].join(" ");
};

export interface MyTabProps<TModel, TTable extends TableNames> {
  title: string;
  service: IService<TModel, TTable>;
  queryKey: string[];
  groupBy?: string;
  Footer?: ReactNode | string;
  detailsContent?: (item: any) => string;
  customAction?: ReactNode | ((item: any) => ReactNode);
  UpsertModal?: (item: any) => ReactNode;
  initialState?: any;
  detailsUrl?: string;
  icons?: boolean;
  showRestore?: boolean;
  customRenderItem?: (item: TModel, isSelected: boolean, onLongPress: () => void, onPress: () => void) => ReactNode;
  showDeleted?: boolean;
  dependencyConfig?: DependencyConfig;
  customFindAll?: () => ReturnType<IService<TModel, TTable>["useFindAll"]>;
  itemChildren?: (item: TModel) => ReactNode;
  isPageLoading?: boolean;
  /**
   * Column layout: 1 = always single, 2 = always two, "auto" = two when
   * grouped (> 1 group), else single. Default "auto".
   */
  columns?: 1 | 2 | "auto";
}

export function MyTab<TModel, TTable extends TableNames>({
  title,
  service,
  queryKey,
  groupBy,
  Footer,
  detailsContent,
  customAction,
  UpsertModal,
  initialState,
  detailsUrl,
  icons = true,
  showRestore,
  customRenderItem,
  showDeleted = false,
  dependencyConfig,
  customFindAll,
  itemChildren,
  isPageLoading,
  columns = "auto",
}: MyTabProps<TModel, TTable>) {
  const state = useEntityList<TModel, TTable>({
    service,
    queryKey,
    groupBy,
    showDeleted,
    dependencyConfig,
    customFindAll,
  });

  const singular = singularize(title);
  const editing = !!(state.upsertModal.currentItem as any)?.id;

  return (
    <EntityListScreen<Renderable>
      title={title}
      groupedData={state.groupedData as unknown as Record<string, Renderable[]>}
      isLoading={state.isLoading}
      isPageLoading={isPageLoading}
      isSelectionMode={state.isSelectionMode}
      selectedCount={state.selectedItems.length}
      onRefresh={state.handleRefresh}
      onAdd={UpsertModal ? () => state.upsertModal.open(initialState) : undefined}
      addLabel={`Add ${singular}`}
      onBulkDelete={state.handleBulkDelete}
      Footer={Footer}
      columns={columns}
      upsertOpen={state.upsertModal.isOpen}
      upsertTitle={editing ? `Edit ${singular}` : `Add ${singular}`}
      upsertContent={UpsertModal && state.upsertModal.isOpen ? UpsertModal(state.upsertModal.currentItem) : undefined}
      onUpsertClose={state.upsertModal.close}
      renderItem={item => (
        <EntityListItem
          item={item}
          isSelected={state.isSelected(item as TModel)}
          onPress={() => state.handlePress(item as TModel)}
          onLongPress={() => state.handleLongPress(item as TModel)}
          onEdit={UpsertModal ? () => state.upsertModal.open(item as TModel) : undefined}
          onDelete={() => state.deleteModal.open(item as TModel)}
          onRestore={showRestore ? () => state.restoreModal.open(item as TModel) : undefined}
          icons={icons}
          detailsUrl={detailsUrl}
          detailsContent={detailsContent as ((item: Renderable) => string) | undefined}
          customAction={customAction}
          itemChildren={itemChildren as ((item: Renderable) => ReactNode) | undefined}
          customRenderItem={
            customRenderItem as ((item: Renderable, s: boolean, l: () => void, p: () => void) => ReactNode) | undefined
          }
        />
      )}
      deleteModalSlot={
        <DeleteConfirmModal
          isOpen={state.deleteModal.isOpen}
          setIsOpen={open => {
            if (!open) state.deleteModal.close();
          }}
          itemToDelete={state.deleteModal.itemToDelete as any}
          itemName={singular}
          dependencyCount={state.deleteModal.dependencyCount}
          dependencyType={dependencyConfig?.dependencyType}
          replacementItems={state.deleteModal.replacementItems as any}
          onConfirm={state.deleteModal.handleConfirm}
          allowDeleteDependencies={dependencyConfig?.allowDeleteDependencies}
        />
      }
      restoreModalSlot={
        showRestore ? (
          <ConfirmRestoreModal
            name={title}
            isOpen={state.restoreModal.isOpen}
            setIsOpen={open => {
              if (!open) state.restoreModal.close();
            }}
            isPending={state.restoreModal.isPending}
            doRestore={state.restoreModal.handleConfirm}
          />
        ) : null
      }
    />
  );
}

export default MyTab;
