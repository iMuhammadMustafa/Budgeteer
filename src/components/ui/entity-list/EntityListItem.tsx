/**
 * EntityListItem — pure presentational row for an entity list. No data or
 * mutation logic; everything arrives via props.
 *
 * The row is a real link: it is wrapped in an expo-router `<Link href={detail}>`
 * so on web it shows the URL on hover, opens in a new tab on middle/⌘-click, and
 * exposes "open in new tab" on right-click. A normal press calls
 * `e.preventDefault()` and runs `onPress` (open the inline upsert modal / toggle
 * selection) instead of navigating. Native falls through to `onPress` too.
 *
 * Fixes vs legacy MyTab row: the colored icon tile uses an inline
 * `backgroundColor` (NativeWind can't statically extract `bg-${item.color}`),
 * and selection uses a soft tint (`bg-primary/10`) instead of a solid `bg-primary`
 * that inverted the text.
 */
import { Link } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { accentFor } from "../theme/tokens";
import { cn } from "../utils/cn";
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
  const rowTestID = testID ?? `list-item-${item.id}`;

  // `item.color` is a raw hex (new ColorPicker / migrated DB). When absent, derive
  // a stable hue from the name via the accent palette (hash-by-name), so tiles are
  // never an undifferentiated gray.
  const iconBg = item.color || accentFor(item.name ?? "", isDark ? "dark" : "light").fg;
  const iconColor = item.iconColor || "#FFFFFF";

  const body: ReactNode = customRenderItem ? (
    customRenderItem(item, isSelected, onLongPress, onPress)
  ) : (
    <View className="flex-1 flex-row items-center">
      {icons ? (
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
          {item.icon ? <MyIcon name={item.icon} size={18} color={iconColor} /> : null}
        </View>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-semibold text-body" numberOfLines={1}>
          {item.name}
        </Text>
        {detailsContent || item.details ? (
          <Text className="mt-[1px] text-xs text-ink-mute" numberOfLines={1}>
            {detailsContent ? detailsContent(item) : item.details}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const handleLinkPress = (e: { preventDefault?: () => void }) => {
    // Cancel the SPA navigation; a normal tap opens the modal / toggles selection.
    // Middle-click / ⌘-click / right-click still resolve as real link actions on web.
    e.preventDefault?.();
    onPress();
  };

  const pressable = (
    <Pressable
      testID={`${rowTestID}-press`}
      onPress={detailsUrl ? undefined : onPress}
      onLongPress={onLongPress}
      className="min-w-0 flex-1 flex-row items-center active:opacity-80"
      accessibilityRole="button"
    >
      {body}
    </Pressable>
  );

  return (
    <View testID={rowTestID} className={cn("border-b border-border", isSelected ? "bg-primary/10" : "bg-transparent")}>
      <View className="flex-row items-center px-4 py-2">
        {detailsUrl ? (
          <Link
            href={`${detailsUrl}${item.id}` as any}
            asChild
            onPress={handleLinkPress}
            onLongPress={onLongPress}
            style={{ flex: 1, minWidth: 0 }}
          >
            {pressable}
          </Link>
        ) : (
          pressable
        )}

        {customAction ? (
          <View className="ml-1">{typeof customAction === "function" ? customAction(item) : customAction}</View>
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
      {itemChildren ? itemChildren(item) : null}
    </View>
  );
}
