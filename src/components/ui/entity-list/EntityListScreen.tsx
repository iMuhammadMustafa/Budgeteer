/**
 * EntityListScreen — the presentational page shell for an entity list. Owns the
 * SafeAreaView, toolbar (title + refresh + add), the grouped ScrollView, the
 * floating bulk-delete FAB (offset by the safe-area inset), and the upsert modal
 * surface (a Sheet on narrow viewports, a centered Dialog on wide ones).
 *
 * It does NOT own data-fetching or mutation logic — `renderItem` and every modal
 * slot are supplied by the parent (typically wired from `useEntityList`).
 */
import { type ReactNode } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Dialog } from "../overlay/Dialog";
import { Sheet } from "../overlay/Sheet";
import { IconButton } from "../IconButton";
import { SkeletonGroup } from "../Skeleton";
import { Text } from "../Text";
import { cn } from "../utils/cn";

export interface EntityListScreenProps<TModel extends { id: string }> {
  title: string;
  groupedData: Record<string, TModel[]>;
  renderItem: (item: TModel) => ReactNode;
  isLoading?: boolean;
  isPageLoading?: boolean;
  isSelectionMode: boolean;
  onRefresh: () => void;
  /** Omit to hide the add button. */
  onAdd?: () => void;
  onBulkDelete: () => void;
  Footer?: ReactNode | string;

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

export function EntityListScreen<TModel extends { id: string }>({
  title,
  groupedData,
  renderItem,
  isLoading,
  isPageLoading,
  isSelectionMode,
  onRefresh,
  onAdd,
  onBulkDelete,
  Footer,
  upsertOpen,
  upsertTitle,
  upsertContent,
  onUpsertClose,
  deleteModalSlot,
  restoreModalSlot,
  testID = "entity-list",
}: EntityListScreenProps<TModel>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const useSheet = width < 768;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]} testID={testID}>
      <View className={cn("w-full flex-1", Platform.OS === "web" && "mx-auto max-w-3xl")}>
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text variant="h3">{title}</Text>
          <View className="flex-row items-center gap-1">
            <IconButton
              testID="refresh-btn"
              icon="RefreshCw"
              variant="ghost"
              accessibilityLabel="Refresh"
              onPress={onRefresh}
            />
            {onAdd ? (
              <IconButton
                testID="add-btn"
                icon="Plus"
                variant="ghost"
                accessibilityLabel={`Add ${title}`}
                onPress={onAdd}
              />
            ) : null}
          </View>
        </View>

        {isLoading || isPageLoading ? (
          <View className="px-4">
            <SkeletonGroup count={8} />
          </View>
        ) : (
          <ScrollView className="custom-scrollbar mt-1" contentContainerStyle={{ paddingBottom: 96 }}>
            {Object.entries(groupedData).map(([groupName, itemsInGroup]) => (
              <View key={groupName || "__ungrouped"}>
                {groupName ? (
                  <Text variant="overline" className="bg-surface-alt px-4 py-1.5">
                    {groupName}
                  </Text>
                ) : null}
                {itemsInGroup.map(item => (
                  <View key={item.id}>{renderItem(item)}</View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {Footer ? <View className="p-2">{typeof Footer === "string" ? <Text>{Footer}</Text> : Footer}</View> : null}
      </View>

      {isSelectionMode ? (
        <View className="absolute right-4" style={{ bottom: insets.bottom + 16 }}>
          <IconButton
            testID="bulk-delete-btn"
            icon="Trash"
            variant="destructive"
            size="lg"
            accessibilityLabel="Delete selected"
            onPress={onBulkDelete}
            className="h-14 w-14 rounded-full"
          />
        </View>
      ) : null}

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
