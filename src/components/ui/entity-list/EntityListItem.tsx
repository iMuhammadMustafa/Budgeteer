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
import { memo, useCallback, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { useTheme } from "@/src/providers/ThemeProvider";

import { Divider } from "../Divider";
import { IconButton } from "../IconButton";
import { ListRow } from "../ListRow";
import { accentFor, swatchForHex, type AccentSwatch, type ThemeName } from "../theme/tokens";
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

  // ── Action buttons (ListRow `right` slot) ──
  // `customAction` should return a bare fragment of IconButtons so they flow in as
  // direct siblings of the built-in actions, sharing this single row + gap.
  const actions = (
    <View className="flex-row items-center">
      {customAction ? (typeof customAction === "function" ? customAction(item) : customAction) : null}
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
        <IconButton
          testID={`edit-btn-${item.id}`}
          icon="SquarePen"
          size="sm"
          accessibilityLabel="Edit"
          onPress={edit}
        />
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
        <IconButton
          testID={`delete-btn-${item.id}`}
          icon="Trash2"
          size="sm"
          accessibilityLabel="Delete"
          onPress={del}
        />
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

  // ── Body press target — wraps ONLY the icon/title/subtitle region so actions
  //    (in the ListRow `right` slot) sit outside it and their taps never bubble
  //    into navigation. On web it's a `<Link>` (hover URL + middle/⌘-click);
  //    `detailHref` navigates to the detail page (tap toggles selection in
  //    selection mode), `detailsUrl` is the legacy "tap opens the upsert modal"
  //    mode, and with neither it's a plain press. ──
  const navHref = detailHref ? `${detailHref}${item.id}` : detailsUrl ? `${detailsUrl}${item.id}` : undefined;
  const wrapBody = useCallback(
    (body: ReactNode): ReactNode => {
      // No link: a plain pressable body. (The Link branch below owns the press via
      // its own onPress — the child pressable must NOT set one, or `asChild`
      // prop-merging clobbers the Link's navigation handler.)
      if (!navHref) {
        return (
          <Pressable
            testID={`${rowTestID}-press`}
            onPress={press}
            onLongPress={longPress}
            className="min-w-0 flex-1 active:opacity-80"
            accessibilityRole="button"
          >
            {body}
          </Pressable>
        );
      }
      return (
        <Link
          href={navHref as never}
          asChild
          // Intercept so web does a client-side navigation instead of hard-navigating
          // the bare <a> href. detailHref navigates (unless selecting); detailsUrl presses.
          onPress={(e: { preventDefault?: () => void }) => {
            e.preventDefault?.();
            if (detailHref && !selectionMode) router.push(navHref as never);
            else press();
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
            {body}
          </Pressable>
        </Link>
      );
    },
    [navHref, detailHref, rowTestID, selectionMode, press, longPress, router],
  );

  // ── Row: custom-render bypass, or the standard ListRow. Either way the actions
  //    sit in the trailing slot with matching spacing (`ml-[10px]`) so custom and
  //    standard rows read identically. ──
  const row = customRenderItem ? (
    <View className="flex-row items-center px-[15px] py-[13px]">
      {wrapBody(<View className="min-w-0 flex-1">{customRenderItem(item, selected, longPress, press)}</View>)}
      <View className="ml-[10px] items-end">{actions}</View>
    </View>
  ) : (
    <ListRow
      testID={`${rowTestID}-row`}
      bare
      title={item.name ?? ""}
      subtitle={detailsContent ? detailsContent(item) : item.details}
      iconName={icons ? item.icon : undefined}
      iconColor={swatch.fg}
      iconBg={swatch.soft}
      bodyWrapper={wrapBody}
      right={actions}
    />
  );

  // ── Bordered container: constant border box, only color/tint changes on
  //    selection (no layout shift). Expanded children (e.g. savings buckets)
  //    render below the row — matches `ui/ExpandableRow`. ──
  return (
    <View
      testID={rowTestID}
      className={cn(
        "overflow-hidden rounded-xl border bg-surface",
        selected ? "border-primary bg-primary/10" : "border-border",
      )}
    >
      {row}
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
