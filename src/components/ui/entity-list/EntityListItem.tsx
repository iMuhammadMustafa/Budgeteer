/**
 * EntityListItem — pure presentational row for an entity list, built on top of
 * the `ui/ListRow` primitive. No data or mutation logic; everything via props.
 *
 * Design (Sage Paper):
 * - The row is a single bordered "card" container. The group layout (a wrapping
 *   `Card` vs. a bare header) is decided by `EntityListScreen`; the row always
 *   carries its OWN border/background so it reads as a card whether it sits inside
 *   a group Card or stands alone. `ListRow` is rendered `bare` inside this
 *   container so there is exactly one border.
 * - Icon tile: soft bg + saturated icon (`swatchForHex` palette lookup, with
 *   `accentFor` fallback when `item.color` is absent).
 * - Selection is a NON-layout-affecting state: the 1px border is always present
 *   and only its color (+ a soft tint) changes, so selecting never shifts width
 *   or height.
 * - `itemChildren` (e.g. savings buckets) render as an expandable section gated
 *   by a chevron, collapsed by default.
 * - The row is a real link on web: wrapped in an expo-router `<Link>` so it shows
 *   the URL on hover and opens in a new tab on middle/⌘-click; a normal press
 *   calls `preventDefault()` and runs `onPress` instead of navigating.
 *
 * Performance: wrapped in `React.memo`. Handlers are item-aware and expected to
 * be stable refs (see `EntityListItemProps`), and per-row closures are built with
 * `useCallback`, so toggling one row's selection does not re-render the others.
 */
import { Link, useRouter } from "expo-router";
import { memo, useCallback, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Divider } from "../Divider";
import { IconButton } from "../IconButton";
import { ListRow } from "../ListRow";
import { accentFor, type AccentSwatch, swatchForHex, type ThemeName } from "../theme/tokens";
import { cn } from "../utils/cn";
import { EntityLike, EntityListItemProps } from "./types";

// swatchForHex scans the accent palette on every call; cache the result per
// theme+hex so a list of N rows doesn't repeat the scan each render.
const hexSwatchCache = new Map<string, AccentSwatch | undefined>();
function cachedSwatchForHex(hex: string, theme: ThemeName): AccentSwatch | undefined {
  const key = `${theme}:${hex.toLowerCase()}`;
  if (hexSwatchCache.has(key)) return hexSwatchCache.get(key);
  const swatch = swatchForHex(hex, theme);
  hexSwatchCache.set(key, swatch);
  return swatch;
}

function EntityListItemInner<TModel extends EntityLike>({
  item,
  selected,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  onRestore,
  icons = true,
  detailsUrl,
  detailHref,
  selectionMode = false,
  detailsContent,
  customAction,
  itemChildren,
  customRenderItem,
  isProtected = false,
  testID,
}: EntityListItemProps<TModel>) {
  const { isDark } = useTheme();
  const router = useRouter();
  const theme: ThemeName = isDark ? "dark" : "light";
  const rowTestID = testID ?? `list-item-${item.id}`;
  const [expanded, setExpanded] = useState(false);

  // ── Icon color resolution ──
  // DB `item.color` is a hex from the ColorPicker (accent palette fg values).
  // Look up its swatch for the correct soft/fg pair. When absent, derive a
  // stable accent from the entity name.
  const swatch = item.color
    ? (cachedSwatchForHex(item.color, theme) ?? accentFor(item.name ?? "", theme))
    : accentFor(item.name ?? "", theme);

  // ── Per-row closures (stable; handlers themselves are stable refs) ──
  const press = useCallback(() => onPress(item), [onPress, item]);
  const longPress = useCallback(() => onLongPress(item), [onLongPress, item]);
  const edit = useCallback(() => onEdit?.(item), [onEdit, item]);
  const del = useCallback(() => onDelete(item), [onDelete, item]);
  const restore = useCallback(() => onRestore?.(item), [onRestore, item]);
  const toggleExpand = useCallback(() => setExpanded(e => !e), []);

  const hasChildren = !!itemChildren;

  // ── Action buttons (right slot) ──
  const actions = (
    <View className="flex-row items-center gap-0.5">
      {customAction ? (
        <View>{typeof customAction === "function" ? customAction(item) : customAction}</View>
      ) : null}
      {hasChildren ? (
        <IconButton
          testID={`expand-btn-${item.id}`}
          icon={expanded ? "ChevronDown" : "ChevronRight"}
          variant="ghost"
          size="sm"
          accessibilityLabel={expanded ? "Collapse" : "Expand"}
          onPress={toggleExpand}
        />
      ) : null}
      {onEdit ? (
        <IconButton testID={`edit-btn-${item.id}`} icon="SquarePen" size="sm" accessibilityLabel="Edit" onPress={edit} />
      ) : null}
      {isProtected ? (
        // Protected rows can't be deleted; the lock opens the confirm dialog,
        // which explains why and keeps its Delete action disabled.
        <IconButton
          testID={`delete-btn-${item.id}`}
          icon="Lock"
          size="sm"
          variant="ghost"
          accessibilityLabel="Protected — can't delete"
          onPress={del}
        />
      ) : (
        <IconButton testID={`delete-btn-${item.id}`} icon="Trash2" size="sm" accessibilityLabel="Delete" onPress={del} />
      )}
      {onRestore ? (
        <IconButton
          testID={`restore-btn-${item.id}`}
          icon="RotateCcw"
          size="sm"
          accessibilityLabel="Restore"
          onPress={restore}
        />
      ) : null}
    </View>
  );

  // ── Row body: custom render bypass, or the standard ListRow (bare; the
  //    container below provides the single border). Actions are NOT included
  //    here — they render as a SIBLING of the press target (below) so tapping
  //    an action button never bubbles into the row press / Link navigation. ──
  const rowInner = customRenderItem ? (
    <View className="min-w-0 flex-1 px-[15px] py-[13px]">{customRenderItem(item, selected, longPress, press)}</View>
  ) : (
    <ListRow
      testID={`${rowTestID}-row`}
      bare
      title={item.name ?? ""}
      subtitle={detailsContent ? detailsContent(item) : item.details}
      iconName={icons ? item.icon : undefined}
      iconColor={swatch.fg}
      iconBg={swatch.soft}
    />
  );

  // ── Press target (link on web for hover URL + middle-click; plain otherwise) ──
  // Two link modes:
  //  - detailHref: a real detail-page navigation. A normal tap navigates (Link
  //    default); only in selection mode do we intercept to toggle selection.
  //  - detailsUrl: the legacy "row opens the upsert modal" mode — the Link exists
  //    for hover URL / middle-click, but a normal tap is intercepted to run onPress.
  const navHref = detailHref ? `${detailHref}${item.id}` : undefined;
  const pressTarget = navHref ? (
    <Link
      href={navHref as never}
      asChild
      // Always intercept the click so web does a client-side navigation instead
      // of a full-page reload (the bare <a> href would otherwise hard-navigate).
      onPress={(e: { preventDefault?: () => void }) => {
        e.preventDefault?.();
        if (selectionMode) press();
        else router.push(navHref as never);
      }}
      onLongPress={longPress}
      style={{ flex: 1, minWidth: 0 }}
    >
      <Pressable
        testID={`${rowTestID}-press`}
        onLongPress={longPress}
        className="min-w-0 flex-1 active:opacity-80"
        accessibilityRole="button"
      >
        {rowInner}
      </Pressable>
    </Link>
  ) : detailsUrl ? (
    <Link
      href={`${detailsUrl}${item.id}` as never}
      asChild
      onPress={(e: { preventDefault?: () => void }) => {
        e.preventDefault?.();
        press();
      }}
      onLongPress={longPress}
      style={{ flex: 1, minWidth: 0 }}
    >
      <Pressable
        testID={`${rowTestID}-press`}
        onLongPress={longPress}
        className="min-w-0 flex-1 active:opacity-80"
        accessibilityRole="button"
      >
        {rowInner}
      </Pressable>
    </Link>
  ) : (
    <Pressable
      testID={`${rowTestID}-press`}
      onPress={press}
      onLongPress={longPress}
      className="min-w-0 flex-1 active:opacity-80"
      accessibilityRole="button"
    >
      {rowInner}
    </Pressable>
  );

  // ── Bordered container: constant border box, only color/tint changes on
  //    selection (no layout shift). Row + actions sit in a flex-row; expanded
  //    children (e.g. savings buckets) render below. ──
  return (
    <View
      testID={rowTestID}
      className={cn(
        "overflow-hidden rounded-xl border bg-surface",
        selected ? "border-primary bg-primary/10" : "border-border",
      )}
    >
      <View className="flex-row items-center">
        {pressTarget}
        <View className="pr-[13px]">{actions}</View>
      </View>
      {hasChildren && expanded ? (
        <View>
          <Divider />
          <View className="p-3">{itemChildren!(item)}</View>
        </View>
      ) : null}
    </View>
  );
}

export const EntityListItem = memo(EntityListItemInner) as typeof EntityListItemInner;
