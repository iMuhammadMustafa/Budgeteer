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
 */
import { Fragment, type ReactNode } from "react";
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

/** ≥ this width, two-column layouts are allowed (else single column). */
const TWO_COL_MIN_WIDTH = 1024;

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

/** Distribute weighted blocks into `cols` columns, always adding the next block
 *  to the currently-shortest column — keeps column heights balanced. */
function balanceColumns(blocks: { weight: number; node: ReactNode }[], cols: number): ReactNode[][] {
  const columns = Array.from({ length: cols }, () => ({ nodes: [] as ReactNode[], total: 0 }));
  for (const block of blocks) {
    const target = columns.reduce((min, c) => (c.total < min.total ? c : min), columns[0]);
    target.nodes.push(block.node);
    target.total += block.weight;
  }
  return columns.map(c => c.nodes);
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
  const useSheet = width < 768;
  const confirm = useConfirm();

  const groups = Object.entries(groupedData);
  const isGrouped = groups.length > 1 || (groups.length === 1 && groups[0][0] !== "");
  const wantTwoCol = columns === 2 || (columns === "auto" && isGrouped);
  const numCols = wantTwoCol && width >= TWO_COL_MIN_WIDTH ? 2 : 1;

  const handleBulkDeleteConfirm = async () => {
    const ok = await confirm({
      title: "Delete Selected",
      message: `Are you sure you want to delete ${selectedCount} selected item${selectedCount === 1 ? "" : "s"}? This action cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (ok) onBulkDelete();
  };

  // Build the top-level blocks: one per group (grouped) or one per row (ungrouped).
  const blocks: { weight: number; node: ReactNode }[] = isGrouped
    ? groups.map(([groupName, itemsInGroup]) => ({
        weight: itemsInGroup.length + 1,
        node: (
          <GroupSection
            key={groupName || "__ungrouped"}
            groupName={groupName}
            items={itemsInGroup}
            renderItem={renderItem}
            groupStyle={groupStyle}
          />
        ),
      }))
    : (groups[0]?.[1] ?? []).map(item => ({
        weight: 1,
        node: <Fragment key={item.id}>{renderItem(item)}</Fragment>,
      }));

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]} testID={testID}>
      <View className={cn("w-full flex-1", Platform.OS === "web" && "mx-auto max-w-5xl")}>
        {/* ── Toolbar (fixed height so entering selection mode doesn't shift the list) ── */}
        <View className="flex-row items-center justify-between px-4 py-2" style={{ minHeight: 52 }}>
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
        ) : (
          <ScrollView className="custom-scrollbar mt-1" contentContainerStyle={{ paddingBottom: 96 }}>
            {numCols === 2 ? (
              <View className="flex-row gap-4 px-4 pb-4 lg:px-6">
                {balanceColumns(blocks, 2).map((colNodes, i) => (
                  <View key={i} className="flex-1 gap-3">
                    {colNodes}
                  </View>
                ))}
              </View>
            ) : (
              <View className="gap-3 px-4 pb-4">{blocks.map(b => b.node)}</View>
            )}
          </ScrollView>
        )}

        {/* ── Footer ── */}
        {Footer ? (
          <Card padded={false} className="mx-4 mb-4 p-4" testID="entity-list-footer">
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
