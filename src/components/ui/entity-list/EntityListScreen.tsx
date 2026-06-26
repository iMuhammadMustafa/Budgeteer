/**
 * EntityListScreen — the presentational page shell for an entity list. Owns the
 * SafeAreaView, toolbar (title + refresh + labeled add + bulk-delete), grouped
 * ScrollView with Card-wrapped sections, and the upsert modal surface (a Sheet
 * on narrow viewports, a centered Dialog on wide ones).
 *
 * It does NOT own data-fetching or mutation logic — `renderItem` and every modal
 * slot are supplied by the parent (typically wired from `useEntityList`).
 *
 * Sage Paper presentation:
 * - Grouped data → each group is a `<Card>` with an overline header; rows are
 *   bare `<ListRow>` inside (no per-row card chrome).
 * - Ungrouped data → each row is its own `<ListRow>` card (with chrome).
 * - Optional two-column grid (NativeWind `lg:grid-cols-2`).
 * - Labeled add button ("＋ Add Account") instead of a bare icon.
 * - Bulk delete in toolbar (with `useConfirm`) instead of a floating FAB.
 * - Footer slot wrapped in a styled Card surface.
 */
import { createContext, type ReactNode, useContext } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../Button";
import { Card } from "../Card";
import { IconButton } from "../IconButton";
import { Dialog } from "../overlay/Dialog";
import { Sheet } from "../overlay/Sheet";
import { useConfirm } from "../overlay/useConfirm";
import { SkeletonGroup } from "../Skeleton";
import { Text } from "../Text";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------------ *
 * Layout context — tells EntityListItem whether it's inside a grouped *
 * Card (bare) or rendering standalone (with its own card chrome).     *
 * ------------------------------------------------------------------ */
const EntityListLayoutContext = createContext({ grouped: false });
export const useEntityListLayout = () => useContext(EntityListLayoutContext);

/* ------------------------------------------------------------------ *
 * Props                                                               *
 * ------------------------------------------------------------------ */
export interface EntityListScreenProps<TModel extends { id: string }> {
  title: string;
  groupedData: Record<string, TModel[]>;
  renderItem: (item: TModel) => ReactNode;
  isLoading?: boolean;
  isPageLoading?: boolean;
  isSelectionMode: boolean;
  selectedCount?: number;
  onRefresh: () => void;
  /** Omit to hide the add button. */
  onAdd?: () => void;
  /** Label for the add button, e.g. "Add Account". */
  addLabel?: string;
  onBulkDelete: () => void;
  Footer?: ReactNode | string;

  /**
   * Column layout: 1 = always single, 2 = always two, "auto" = two when
   * grouped (> 1 group), else single. Always collapses to 1 on narrow
   * viewports via responsive NativeWind classes.
   */
  columns?: 1 | 2 | "auto";

  // Upsert modal surface (responsive Sheet/Dialog), driven by the parent.
  upsertOpen?: boolean;
  upsertTitle?: string;
  upsertContent?: ReactNode;
  onUpsertClose?: () => void;

  // Pre-rendered delete / restore confirmation modals.
  deleteModalSlot?: ReactNode;
  restoreModalSlot?: ReactNode;

  testID?: string;
}

/* ------------------------------------------------------------------ *
 * Component                                                           *
 * ------------------------------------------------------------------ */
export function EntityListScreen<TModel extends { id: string }>({
  title,
  groupedData,
  renderItem,
  isLoading,
  isPageLoading,
  isSelectionMode,
  selectedCount = 0,
  onRefresh,
  onAdd,
  addLabel,
  onBulkDelete,
  Footer,
  columns = "auto",
  upsertOpen,
  upsertTitle,
  upsertContent,
  onUpsertClose,
  deleteModalSlot,
  restoreModalSlot,
  testID = "entity-list",
}: EntityListScreenProps<TModel>) {
  const { width } = useWindowDimensions();
  const useSheet = width < 768;
  const confirm = useConfirm();

  const groups = Object.entries(groupedData);
  const isGrouped = groups.length > 1 || (groups.length === 1 && groups[0][0] !== "");
  const use2Col = columns === 2 || (columns === "auto" && isGrouped);

  const handleBulkDeleteConfirm = async () => {
    const ok = await confirm({
      title: "Delete Selected",
      message: `Are you sure you want to delete ${selectedCount} selected item${selectedCount === 1 ? "" : "s"}? This action cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (ok) onBulkDelete();
  };

  const gridCls = use2Col ? "px-4 pb-4 gap-3 lg:px-6 lg:grid lg:grid-cols-2 lg:gap-4" : "px-4 pb-4 gap-3";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]} testID={testID}>
      <View className={cn("w-full flex-1", Platform.OS === "web" && "mx-auto max-w-5xl")}>
        {/* ── Toolbar ── */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text variant="h3">{title}</Text>
          <View className="flex-row items-center gap-2">
            {isSelectionMode ? (
              <>
                <Text variant="label" className="mr-1">
                  {selectedCount} selected
                </Text>
                <Button
                  testID="bulk-delete-btn"
                  label="Delete"
                  leadingIcon="Trash2"
                  variant="destructive"
                  size="sm"
                  onPress={handleBulkDeleteConfirm}
                />
              </>
            ) : (
              <>
                <IconButton
                  testID="refresh-btn"
                  icon="RefreshCw"
                  variant="ghost"
                  accessibilityLabel="Refresh"
                  onPress={onRefresh}
                />
                {onAdd ? (
                  <Button
                    testID="add-btn"
                    label={addLabel ? `＋ ${addLabel}` : `＋ Add`}
                    leadingIcon="Plus"
                    variant="outline"
                    size="sm"
                    onPress={onAdd}
                  />
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* ── Body ── */}
        {isLoading || isPageLoading ? (
          <View className="px-4">
            <SkeletonGroup count={8} />
          </View>
        ) : (
          <EntityListLayoutContext.Provider value={{ grouped: isGrouped }}>
            <ScrollView className="custom-scrollbar mt-1" contentContainerStyle={{ paddingBottom: 96 }}>
              <View className={gridCls}>
                {groups.map(([groupName, itemsInGroup]) =>
                  isGrouped ? (
                    /* ── Grouped: Card with overline header ── */
                    <Card
                      key={groupName || "__ungrouped"}
                      padded={false}
                      className="overflow-hidden"
                      testID={`group-card-${groupName}`}
                    >
                      {groupName ? (
                        <View className="px-4 pt-3 pb-1 border-b border-border">
                          <Text variant="overline">{groupName}</Text>
                        </View>
                      ) : null}
                      {itemsInGroup.map(item => (
                        <View key={item.id}>{renderItem(item)}</View>
                      ))}
                    </Card>
                  ) : (
                    /* ── Ungrouped: each row is a standalone card ── */
                    itemsInGroup.map(item => <View key={item.id}>{renderItem(item)}</View>)
                  ),
                )}
              </View>
            </ScrollView>
          </EntityListLayoutContext.Provider>
        )}

        {/* ── Footer ── */}
        {Footer ? (
          <Card className="mx-4 mb-4" testID="entity-list-footer">
            {typeof Footer === "string" ? <Text className="text-center">{Footer}</Text> : Footer}
          </Card>
        ) : null}
      </View>

      {/* ── Upsert modal (responsive Sheet / Dialog) ── */}
      {upsertContent && useSheet ? (
        <Sheet visible={!!upsertOpen} onClose={() => onUpsertClose?.()} title={upsertTitle}>
          {upsertContent}
        </Sheet>
      ) : upsertContent ? (
        <Dialog visible={!!upsertOpen} onClose={() => onUpsertClose?.()} title={upsertTitle}>
          {upsertContent}
        </Dialog>
      ) : null}

      {deleteModalSlot}
      {restoreModalSlot}
    </SafeAreaView>
  );
}
