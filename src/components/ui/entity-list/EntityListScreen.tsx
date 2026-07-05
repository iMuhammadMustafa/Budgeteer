/**
 * EntityListScreen — the presentational page shell for an entity list. Owns the
 * SafeAreaView, toolbar (title + refresh + add + bulk-delete), the scrolling
 * body, and the upsert modal surface (a Sheet on narrow viewports, a centered
 * Dialog on wide ones).
 *
 * It does NOT own data-fetching or mutation logic — `renderItem` and every modal
 * slot are supplied by the parent (typically wired from `useEntityList`).
 *
 * Sage Paper presentation:
 * - Rows are always card-like (each `EntityListItem` carries its own border).
 * - Grouped data → each group is a section. `groupStyle="card"` wraps the section
 *   in a padded `Card` with an overline header (rows are cards-inside-a-card);
 *   `groupStyle="plain"` uses a bare overline header above the row-cards.
 * - Wide viewports place sections (or, ungrouped, rows) into a height-BALANCED
 *   two-column layout — sections are distributed to the shortest column so the
 *   columns stay even (no dead whitespace), unlike a CSS grid.
 * - Labeled add button (icon + text) — single Plus affordance.
 * - Bulk delete in the toolbar (with `useConfirm`) instead of a floating FAB.
 *
 * Performance (Phase 4): the body is a flattened row model computed in ONE
 * `useMemo` (group blocks or, ungrouped, item rows). The common single-column
 * layout renders through a virtualized `FlatList` so off-screen rows/groups are
 * not mounted; the wide two-column layout keeps the balanced-height distribution
 * (memoized) in a `ScrollView` — that path only triggers on ≥1024px desktop
 * where virtualization is not the bottleneck.
 */
import { Fragment, useCallback, useMemo, type ReactNode } from "react";
import { FlatList, Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../Button";
import { Card } from "../Card";
import { IconButton } from "../IconButton";
import { ResponsiveModal } from "../overlay/ResponsiveModal";
import { useConfirm } from "../overlay/useConfirm";
import { SkeletonGroup } from "../Skeleton";
import { Text } from "../Text";
import { cn } from "../utils/cn";

/** ≥ this width, two-column layouts are allowed (else single column). */
const TWO_COL_MIN_WIDTH = 1024;

/* ------------------------------------------------------------------ *
 * Row model — the flattened list the body renders.                    *
 * ------------------------------------------------------------------ */
type EntityRow<TModel extends { id: string }> =
  | { type: "group"; key: string; groupName: string; items: TModel[] }
  | { type: "row"; key: string; item: TModel };

/* ------------------------------------------------------------------ *
 * Props                                                               *
 * ------------------------------------------------------------------ */
export interface EntityListScreenProps<TModel extends { id: string }> {
  title: string;
  /** Hide the in-page toolbar heading (e.g. on Restore tabs where the SecondaryTabBar already names it). Default true. */
  showTitle?: boolean;
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
   * viewports.
   */
  columns?: 1 | 2 | "auto";

  /**
   * How a group renders: "card" wraps the group in a padded Card with an
   * overline header; "plain" uses a bare overline header above the rows.
   * Ignored for ungrouped data (rows are standalone cards either way).
   */
  groupStyle?: "card" | "plain";

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
 * GroupSection — one group's header + its row-cards.                  *
 * ------------------------------------------------------------------ */
function GroupSection<TModel extends { id: string }>({
  groupName,
  items,
  renderItem,
  groupStyle,
}: {
  groupName: string;
  items: TModel[];
  renderItem: (item: TModel) => ReactNode;
  groupStyle: "card" | "plain";
}) {
  const header = groupName ? (
    <Text variant="overline" className={groupStyle === "card" ? "mb-2" : "mb-2 px-1"}>
      {groupName}
    </Text>
  ) : null;

  const rows = (
    <View className="gap-2">
      {items.map(item => (
        <Fragment key={item.id}>{renderItem(item)}</Fragment>
      ))}
    </View>
  );

  if (groupStyle === "card") {
    return (
      <Card padded={false} className="p-4" testID={`group-card-${groupName}`}>
        {header}
        {rows}
      </Card>
    );
  }
  return (
    <View testID={`group-section-${groupName}`}>
      {header}
      {rows}
    </View>
  );
}

/** Distribute weighted values into `cols` columns, always adding the next value
 *  to the currently-shortest column — keeps column heights balanced. */
function balanceColumns<T>(blocks: { weight: number; value: T }[], cols: number): T[][] {
  const columns = Array.from({ length: cols }, () => ({ values: [] as T[], total: 0 }));
  for (const block of blocks) {
    const target = columns.reduce((min, c) => (c.total < min.total ? c : min), columns[0]);
    target.values.push(block.value);
    target.total += block.weight;
  }
  return columns.map(c => c.values);
}

/* ------------------------------------------------------------------ *
 * Component                                                           *
 * ------------------------------------------------------------------ */
export function EntityListScreen<TModel extends { id: string }>({
  title,
  showTitle = true,
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
  groupStyle = "card",
  upsertOpen,
  upsertTitle,
  upsertContent,
  onUpsertClose,
  deleteModalSlot,
  restoreModalSlot,
  testID = "entity-list",
}: EntityListScreenProps<TModel>) {
  const { width } = useWindowDimensions();
  const confirm = useConfirm();

  const groups = useMemo(() => Object.entries(groupedData), [groupedData]);
  const isGrouped = groups.length > 1 || (groups.length === 1 && groups[0][0] !== "");
  const wantTwoCol = columns === 2 || (columns === "auto" && isGrouped);
  const numCols = wantTwoCol && width >= TWO_COL_MIN_WIDTH ? 2 : 1;

  // Flattened row model: one entry per group (grouped) or per row (ungrouped).
  // Depends only on the (memoized) grouped data, so it stays referentially
  // stable across selection toggles and re-renders.
  const listData = useMemo<EntityRow<TModel>[]>(() => {
    if (isGrouped) {
      return groups.map(([groupName, items]) => ({
        type: "group" as const,
        key: groupName || "__ungrouped",
        groupName,
        items,
      }));
    }
    return (groups[0]?.[1] ?? []).map(item => ({ type: "row" as const, key: item.id, item }));
  }, [groups, isGrouped]);

  const renderRow = useCallback(
    (row: EntityRow<TModel>): ReactNode =>
      row.type === "group" ? (
        <GroupSection groupName={row.groupName} items={row.items} renderItem={renderItem} groupStyle={groupStyle} />
      ) : (
        <Fragment>{renderItem(row.item)}</Fragment>
      ),
    [renderItem, groupStyle],
  );

  const flatRenderItem = useCallback(
    ({ item }: { item: EntityRow<TModel> }) => <>{renderRow(item)}</>,
    [renderRow],
  );

  // Wide two-column layout: distribute rows into height-balanced columns.
  const balancedColumns = useMemo(
    () =>
      balanceColumns(
        listData.map(row => ({ weight: row.type === "group" ? row.items.length + 1 : 1, value: row })),
        2,
      ),
    [listData],
  );

  const handleBulkDeleteConfirm = async () => {
    const ok = await confirm({
      title: "Delete Selected",
      message: `Are you sure you want to delete ${selectedCount} selected item${selectedCount === 1 ? "" : "s"}? This action cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (ok) onBulkDelete();
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]} testID={testID}>
      <View className={cn("w-full flex-1", Platform.OS === "web" && "mx-auto max-w-5xl")}>
        {/* ── Toolbar (fixed height so entering selection mode doesn't shift the list) ── */}
        <View className="flex-row items-center justify-between px-4 py-2" style={{ minHeight: 52 }}>
          {showTitle ? <Text variant="h3">{title}</Text> : <View />}
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
                    label={addLabel ?? "Add"}
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
        ) : numCols === 2 ? (
          // Wide desktop: height-balanced two columns (non-virtualized — the
          // memoized distribution keeps the columns even without dead space).
          <ScrollView className="custom-scrollbar mt-1 flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
            <View className="flex-row gap-4 px-4 pb-4 lg:px-6">
              {balancedColumns.map((colRows, i) => (
                <View key={i} className="flex-1 gap-3">
                  {colRows.map(row => (
                    <Fragment key={row.key}>{renderRow(row)}</Fragment>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          // Single column: virtualized — off-screen rows/groups stay unmounted.
          <FlatList
            className="custom-scrollbar mt-1 flex-1"
            data={listData}
            keyExtractor={row => row.key}
            renderItem={flatRenderItem}
            ItemSeparatorComponent={ROW_SEPARATOR}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
            windowSize={11}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            removeClippedSubviews={Platform.OS !== "web"}
          />
        )}

        {/* ── Footer ── */}
        {Footer ? (
          <Card padded={false} className="mx-4 mb-4 p-4" testID="entity-list-footer">
            {typeof Footer === "string" ? <Text className="text-center">{Footer}</Text> : Footer}
          </Card>
        ) : null}
      </View>

      {/* ── Upsert modal (responsive Sheet / Dialog) ── */}
      {upsertContent ? (
        <ResponsiveModal visible={!!upsertOpen} onClose={() => onUpsertClose?.()} title={upsertTitle} size="lg">
          {upsertContent}
        </ResponsiveModal>
      ) : null}

      {deleteModalSlot}
      {restoreModalSlot}
    </SafeAreaView>
  );
}

/** 12px gap between single-column rows (matches the old `gap-3`). */
const ROW_SEPARATOR = () => <View style={{ height: 12 }} />;
