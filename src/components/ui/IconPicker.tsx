/**
 * IconPicker — choose a lucide icon name (stored on the DB record alongside its
 * color). Shows a curated finance/category set as quick-picks; **searching spans
 * the full lucide library** (~1500 icons) so any icon is reachable, capped per
 * query for perf. `color` tints the trigger preview. Responsive overlay.
 *
 *   <IconPicker label="Icon" value={name} onChange={setName} color={hex} />
 *
 * Backlog (suggested): toggleable category groups, favorites, recently-used.
 */
import { icons as lucideIcons } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { cn } from "./utils/cn";

/** Curated finance/category quick-picks (shown before searching). */
export const FINANCE_ICONS = [
  "ShoppingCart",
  "ShoppingBag",
  "ShoppingBasket",
  "Utensils",
  "Coffee",
  "Pizza",
  "House",
  "Building2",
  "Car",
  "Bus",
  "Train",
  "Plane",
  "Bike",
  "Fuel",
  "Plug",
  "Lightbulb",
  "Wifi",
  "Phone",
  "Smartphone",
  "Tv",
  "Gamepad2",
  "Music",
  "Film",
  "Camera",
  "Ticket",
  "Gift",
  "Heart",
  "Stethoscope",
  "Pill",
  "Dumbbell",
  "GraduationCap",
  "BookOpen",
  "Briefcase",
  "Banknote",
  "Wallet",
  "CreditCard",
  "PiggyBank",
  "Landmark",
  "Coins",
  "DollarSign",
  "TrendingUp",
  "TrendingDown",
  "Receipt",
  "Wrench",
  "Hammer",
  "PawPrint",
  "Baby",
  "Shirt",
  "Scissors",
  "Leaf",
  "Droplet",
  "Flame",
  "Cloud",
  "Tag",
  "Percent",
  "Calendar",
  "Repeat",
  "Users",
  "User",
  "Sparkles",
  "Star",
];

/** All lucide icon names — searched when there's a query. */
const ALL_ICON_NAMES = Object.keys(lucideIcons);
const MAX_RESULTS = 150;

export interface IconPickerProps {
  value?: string | null;
  onChange: (name: string) => void;
  /** Quick-pick icon names shown before searching. Defaults to FINANCE_ICONS. */
  icons?: string[];
  /** Search the full lucide set (default true); false restricts search to `icons`. */
  allIcons?: boolean;
  /** Tint for the trigger preview (e.g. the category's color). */
  color?: string;
  label?: string;
  present?: OverlayPresent;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
  /**
   * "trigger" (default) = a single row that opens the full picker overlay.
   * "inline" = a quick row of selectable tiles (recent-first, then curated fill)
   * with a trailing "View all" tile that opens the same overlay.
   */
  variant?: "trigger" | "inline";
  /** Most-recently-used icon names, shown first in the inline quick row. */
  recent?: string[];
  /** How many quick tiles to show in the inline variant (default 8). */
  quickCount?: number;
}

export function IconPicker({
  value,
  onChange,
  icons = FINANCE_ICONS,
  allIcons = true,
  color,
  label,
  present,
  placeholder = "Pick an icon",
  disabled = false,
  className,
  testID = "icon-picker",
  variant = "trigger",
  recent = [],
  quickCount = 8,
}: IconPickerProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q ? (allIcons ? ALL_ICON_NAMES : icons).filter(n => n.toLowerCase().includes(q)) : icons;
  const visible = q ? matches.slice(0, MAX_RESULTS) : matches;
  const truncated = q && matches.length > MAX_RESULTS;

  const { triggerRef, openOverlay } = usePresentedOverlay({
    present,
    title: label ?? "Choose an icon",
    onClose: () => setQuery(""),
    renderContent: (close, contentMaxHeight) => (
      <View className="max-w-full">
        <View className="flex-row items-center gap-2 border-b border-border px-4 py-2.5">
          <MyIcon name="Search" size={16} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={allIcons ? "Search all icons…" : "Search icons…"}
            placeholderTextColor={colors.inkFaint}
            selectionColor={colors.primary}
            autoFocus={Platform.OS === "web"}
            className="flex-1 p-0 font-sans text-body text-ink"
            style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
            testID={`${testID}-search`}
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          style={{ maxHeight: contentMaxHeight - 45 }}
        >
          {visible.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-mute">No icons match “{query}”</Text>
          ) : (
            <View className="flex-row flex-wrap gap-1.5 p-3">
              {visible.map(name => {
                const selected = name === value;
                return (
                  <Pressable
                    key={name}
                    onPress={() => {
                      onChange(name);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={name}
                    accessibilityState={{ selected }}
                    testID={`${testID}-icon-${name}`}
                    className={cn(
                      "h-10 w-10 items-center justify-center rounded-lg active:opacity-80",
                      selected ? "bg-primary-soft" : "bg-surface-alt",
                    )}
                  >
                    <MyIcon name={name} size={20} color={selected ? colors.primary : colors.inkMute} />
                  </Pressable>
                );
              })}
            </View>
          )}
          {q && visible.length > 0 ? (
            <Text className="px-4 pb-3 text-center text-xs text-ink-faint">
              {truncated
                ? `Showing first ${MAX_RESULTS} of ${matches.length} — refine your search`
                : `${matches.length} ${matches.length === 1 ? "icon" : "icons"}`}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    ),
  });

  // Inline quick row: recent picks first, then curated fill. The row stays STABLE
  // as you select (the current value is only highlighted, never reordered to the
  // front) — recents are updated on form submit, not on every tap.
  const quick = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (n?: string | null) => {
      if (!n || seen.has(n)) return;
      seen.add(n);
      out.push(n);
    };
    recent.forEach(push);
    icons.forEach(push);
    return out.slice(0, quickCount);
  })();

  return (
    <View className={cn("w-full", className)}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      {variant === "inline" ? (
        <View className="flex-row flex-wrap gap-2">
          {quick.map(name => {
            const selected = name === value;
            return (
              <Pressable
                key={name}
                onPress={() => !disabled && onChange(name)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={name}
                accessibilityState={{ selected }}
                testID={`${testID}-quick-${name}`}
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-xl border active:opacity-80",
                  selected ? "border-primary bg-primary-soft" : "border-border bg-surface",
                )}
              >
                <MyIcon name={name} size={20} color={selected ? colors.primary : (color ?? colors.inkMute)} />
              </Pressable>
            );
          })}
          <Pressable
            ref={triggerRef}
            onPress={() => !disabled && openOverlay()}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="View all icons"
            testID={`${testID}-view-all`}
            className={cn(
              "h-11 items-center justify-center rounded-xl border border-dashed border-border bg-surface-alt px-3 active:opacity-80",
              disabled && "opacity-50",
            )}
          >
            <Text className="text-caption text-ink-mute">View all</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          ref={triggerRef}
          onPress={() => !disabled && openOverlay()}
          disabled={disabled}
          accessibilityRole="button"
          testID={testID}
          className={cn(
            "flex-row items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 active:opacity-90",
            disabled && "opacity-50",
          )}
        >
          <View className="h-7 w-7 items-center justify-center rounded-lg bg-surface-alt">
            <MyIcon name={value || "Image"} size={18} color={value ? (color ?? colors.inkMute) : colors.inkFaint} />
          </View>
          <Text className={cn("min-w-0 flex-1 text-body", value ? "text-ink" : "text-ink-faint")} numberOfLines={1}>
            {value ?? placeholder}
          </Text>
          <MyIcon name="ChevronDown" size={18} color={colors.inkFaint} />
        </Pressable>
      )}
    </View>
  );
}
