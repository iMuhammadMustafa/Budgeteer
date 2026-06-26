/**
 * Shared contracts for the entity-list family (the `ui/` replacement for the
 * monolithic legacy `MyTab`). `useEntityList` owns data + CRUD orchestration;
 * `EntityListItem` / `EntityListScreen` are pure presentation.
 */
import { type ReactNode } from "react";

import { IService } from "@/src/services/IService";
import { TableNames } from "@/src/types/database/TableNames";

/** Minimum shape every list item is expected to expose for rendering. */
export type EntityLike = {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  iconColor?: string;
  details?: string;
};

/**
 * Dependency-aware delete configuration. When an entity owns dependent rows
 * (e.g. an Account owns Transactions), deleting it must either re-point those
 * dependents to a replacement or delete them too.
 */
export interface DependencyConfig {
  dependencyField: string;
  dependencyService: Pick<IService<any, any>, "useFindAll" | "useSoftDelete" | "useHardDelete"> & {
    useUpdateMultiple?: () => { mutate: (data: any, options?: any) => void };
  };
  dependencyType: string;
  allowDeleteDependencies?: boolean;
  onBeforeUpdate?: (dependencies: any[], oldItemId: string, newItemId: string) => Promise<void>;
  onAfterUpdate?: (dependencies: any[], oldItemId: string, newItemId: string) => Promise<void>;
}

export interface UseEntityListConfig<TModel, TTable extends TableNames> {
  service: IService<TModel, TTable>;
  queryKey: string[];
  groupBy?: string;
  showDeleted?: boolean;
  dependencyConfig?: DependencyConfig;
  customFindAll?: () => ReturnType<IService<TModel, TTable>["useFindAll"]>;
}

export interface UpsertModalState<TModel> {
  isOpen: boolean;
  currentItem: TModel | undefined;
  open: (item?: TModel) => void;
  close: () => void;
}

export interface DeleteModalState<TModel> {
  isOpen: boolean;
  itemToDelete: TModel | null;
  open: (item: TModel) => void;
  close: () => void;
  handleConfirm: (replacementId?: string, alsoDeleteDeps?: boolean) => Promise<void>;
  dependencyCount: number;
  replacementItems: TModel[];
}

export interface RestoreModalState<TModel> {
  isOpen: boolean;
  itemToRestore: TModel | null;
  open: (item: TModel) => void;
  close: () => void;
  handleConfirm: () => void;
  isPending: boolean;
}

export interface EntityListState<TModel> {
  groupedData: Record<string, TModel[]>;
  isLoading: boolean;
  error: unknown;
  isSelectionMode: boolean;
  selectedItems: TModel[];
  isSelected: (item: TModel) => boolean;
  handleLongPress: (item: TModel) => void;
  handlePress: (item: TModel) => void;
  handleBulkDelete: () => void;
  handleRefresh: () => Promise<void>;
  upsertModal: UpsertModalState<TModel>;
  deleteModal: DeleteModalState<TModel>;
  restoreModal: RestoreModalState<TModel>;
}

export interface EntityListItemProps<TModel extends EntityLike> {
  item: TModel;
  selected: boolean;
  /**
   * Handlers are item-aware (receive the row's item) so the parent can pass a
   * single STABLE callback to every row. EntityListItem is `React.memo`-wrapped;
   * stable handler identity is what lets an unaffected row skip re-rendering when
   * another row's selection toggles.
   */
  onPress: (item: TModel) => void;
  onLongPress: (item: TModel) => void;
  onEdit?: (item: TModel) => void;
  onDelete: (item: TModel) => void;
  onRestore?: (item: TModel) => void;
  /** Show the leading colored icon tile (default true). */
  icons?: boolean;
  /** Used to build the `<Link>` href so the row is a real, openable link on web. */
  detailsUrl?: string;
  detailsContent?: (item: TModel) => string;
  customAction?: ReactNode | ((item: TModel) => ReactNode);
  /** Nested content (e.g. savings buckets). When set, the row gets a chevron and collapses these by default. */
  itemChildren?: (item: TModel) => ReactNode;
  customRenderItem?: (item: TModel, isSelected: boolean, onLongPress: () => void, onPress: () => void) => ReactNode;
  testID?: string;
}
