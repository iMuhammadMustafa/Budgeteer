/**
 * EntityListItem — pure presentational row for an entity list, built on top of
 * the `ui/ListRow` primitive. No data or mutation logic; everything via props.
 *
 * The row is a real link: wrapped in an expo-router `<Link href={detail}>` so on
 * web it shows the URL on hover, opens in a new tab on middle/⌘-click, and
 * exposes "open in new tab" on right-click. A normal press calls
 * `e.preventDefault()` and runs `onPress` instead of navigating.
 *
 * Sage Paper presentation:
 * - Icon tile uses **soft bg + saturated icon** (not saturated bg + white icon).
 *   Color is resolved via `swatchForHex` (palette lookup) with `accentFor`
 *   fallback when `item.color` is absent.
 * - Row is **bare** (no per-row card chrome) when inside a grouped Card
 *   (context from EntityListScreen), or a standalone card when ungrouped.
 * - Selection tint (`bg-primary/10`) is preserved.
 * - Action buttons (edit, delete, restore, custom) render in the ListRow's
 *   `right` slot.
 */
import { Link } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { IconButton } from "../IconButton";
import { ListRow } from "../ListRow";
import { accentFor, swatchForHex } from "../theme/tokens";
import { cn } from "../utils/cn";
import { useEntityListLayout } from "./EntityListScreen";
import { EntityLike, EntityListItemProps } from "./types";

export function EntityListItem<TModel extends EntityLike>({
  item,
  isSelected,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  onRestore,
  icons = true,
  detailsUrl,
  detailsContent,
  customAction,
  itemChildren,
  customRenderItem,
  testID,
}: EntityListItemProps<TModel>) {
  const { isDark } = useTheme();
  const { grouped } = useEntityListLayout();
  const rowTestID = testID ?? `list-item-${item.id}`;

  // ── Icon color resolution ──
  // DB `item.color` is a hex from the ColorPicker (accent palette fg values).
  // Look up its swatch for the correct soft/fg pair. When absent, derive a
  // stable accent from the entity name.
  const theme = isDark ? "dark" : "light";
  const swatch = item.color
    ? (swatchForHex(item.color, theme) ?? accentFor(item.name ?? "", theme))
    : accentFor(item.name ?? "", theme);

  // ── Action buttons (right slot of ListRow) ──
  const actions = (
    <View className="flex-row items-center gap-0.5">
      {customAction ? (
        <View>{typeof customAction === "function" ? customAction(item) : customAction}</View>
      ) : null}
      {onEdit ? (
        <IconButton
          testID={`edit-btn-${item.id}`}
          icon="SquarePen"
          size="sm"
          accessibilityLabel="Edit"
          onPress={onEdit}
        />
      ) : null}
      <IconButton
        testID={`delete-btn-${item.id}`}
        icon="Trash2"
        size="sm"
        accessibilityLabel="Delete"
        onPress={onDelete}
      />
      {onRestore ? (
        <IconButton
          testID={`restore-btn-${item.id}`}
          icon="RotateCcw"
          size="sm"
          accessibilityLabel="Restore"
          onPress={onRestore}
        />
      ) : null}
    </View>
  );

  // ── Custom render bypass ──
  if (customRenderItem) {
    const customBody = customRenderItem(item, isSelected, onLongPress, onPress);
    return (
      <View testID={rowTestID} className={cn(isSelected && "bg-primary/10")}>
        <View className="flex-row items-center px-4 py-2">
          <View className="min-w-0 flex-1">{customBody}</View>
          {actions}
        </View>
        {itemChildren ? itemChildren(item) : null}
      </View>
    );
  }

  // ── Subtitle ──
  const subtitle = detailsContent ? detailsContent(item) : item.details;

  // ── Row content via ListRow ──
  const listRow = (
    <ListRow
      testID={`${rowTestID}-row`}
      title={item.name ?? ""}
      subtitle={subtitle}
      iconName={icons ? item.icon : undefined}
      iconColor={swatch.fg}
      iconBg={swatch.soft}
      bare={grouped}
      right={actions}
      className={cn(isSelected && "bg-primary/10")}
    />
  );

  // ── Link wrapping (web: URL on hover, middle-click → new tab) ──
  const handleLinkPress = (e: { preventDefault?: () => void }) => {
    e.preventDefault?.();
    onPress();
  };

  if (detailsUrl) {
    return (
      <View testID={rowTestID}>
        <Link
          href={`${detailsUrl}${item.id}` as any}
          asChild
          onPress={handleLinkPress}
          onLongPress={onLongPress}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Pressable
            testID={`${rowTestID}-press`}
            onLongPress={onLongPress}
            className="min-w-0 flex-1 active:opacity-80"
            accessibilityRole="button"
          >
            {listRow}
          </Pressable>
        </Link>
        {itemChildren ? itemChildren(item) : null}
      </View>
    );
  }

  return (
    <View testID={rowTestID}>
      <Pressable
        testID={`${rowTestID}-press`}
        onPress={onPress}
        onLongPress={onLongPress}
        className="min-w-0 flex-1 active:opacity-80"
        accessibilityRole="button"
      >
        {listRow}
      </Pressable>
      {itemChildren ? itemChildren(item) : null}
    </View>
  );
}
