/**
 * QuickPills — inline "quick-create" value picker. Shows a compact row of option
 * pills (most-recently-used first, then filled from the full option set) plus a
 * trailing **"View all"** pill that opens a searchable overlay of every option.
 * The companion to the inline `IconPicker`/`ColorPicker` variants: the common
 * choices are one tap away, but the full list is always reachable.
 *
 *   <QuickPills
 *     label="Category"
 *     value={categoryid}
 *     onChange={setCategoryId}
 *     options={categoryOptions}   // [{ value, label, icon?, color?, group? }]
 *     recent={recentCategoryIds}  // ordered value list
 *     onAddNew={() => openCategoryForm()}
 *   />
 */
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface QuickPillOption {
  value: string;
  label: string;
  icon?: string | null;
  /** Hex accent for the leading dot / icon tint. */
  color?: string | null;
  group?: string;
}

export interface QuickPillsProps {
  value?: string | null;
  onChange: (value: string) => void;
  options: QuickPillOption[];
  /** Ordered value list of recent picks, shown first in the quick row. */
  recent?: string[];
  /** How many quick pills to show before "View all" (default 5). */
  quickCount?: number;
  label?: string;
  placeholder?: string;
  viewAllLabel?: string;
  viewAllTitle?: string;
  /** Optional "add new" row inside the overlay. */
  onAddNew?: () => void;
  addNewLabel?: string;
  present?: OverlayPresent;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

/** Only real hex is a valid CSS/icon color; legacy token fragments (e.g. "info-100") aren't. */
function hexOrUndefined(c?: string | null): string | undefined {
  return c && c.startsWith("#") ? c : undefined;
}

function Dot({ color }: { color?: string | null }) {
  const hex = hexOrUndefined(color);
  if (!hex) return null;
  return <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />;
}

export function QuickPills({
  value,
  onChange,
  options,
  recent = [],
  quickCount = 5,
  label,
  placeholder = "Choose one",
  viewAllLabel = "View all",
  viewAllTitle,
  onAddNew,
  addNewLabel = "Add new",
  present,
  error,
  disabled = false,
  className,
  testID = "quick-pills",
}: QuickPillsProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const byValue = useMemo(() => new Map(options.map(o => [o.value, o])), [options]);

  // Quick row: recents first, then fill from options. Stays STABLE as you select
  // (selected pill is only highlighted, never reordered to the front).
  const quick = useMemo(() => {
    const seen = new Set<string>();
    const out: QuickPillOption[] = [];
    const push = (v?: string | null) => {
      if (!v || seen.has(v)) return;
      const o = byValue.get(v);
      if (!o) return;
      seen.add(v);
      out.push(o);
    };
    recent.forEach(push);
    options.forEach(o => push(o.value));
    return out.slice(0, quickCount);
  }, [recent, options, byValue, quickCount]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, QuickPillOption[]>();
    for (const o of filtered) {
      const g = o.group ?? "";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(o);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const { triggerRef, openOverlay } = usePresentedOverlay({
    present,
    title: viewAllTitle ?? label ?? "Choose one",
    onClose: () => setQuery(""),
    renderContent: (close, contentMaxHeight) => (
      <View className="max-w-full">
        {options.length > 5 ? (
          <View className="flex-row items-center gap-2 border-b border-border px-4 py-2.5">
            <MyIcon name="Search" size={16} color={colors.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor={colors.inkFaint}
              selectionColor={colors.primary}
              autoFocus={Platform.OS === "web"}
              className="flex-1 p-0 font-sans text-body text-ink"
              style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
              testID={`${testID}-search`}
            />
          </View>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: contentMaxHeight - 45 }}>
          {onAddNew ? (
            <Pressable
              onPress={() => {
                close();
                onAddNew();
              }}
              accessibilityRole="button"
              testID={`${testID}-add-new`}
              className="flex-row items-center gap-2.5 border-b border-border px-4 py-3 active:opacity-80"
            >
              <MyIcon name="Plus" size={18} color={colors.primary} />
              <Text className="text-body text-primary">{addNewLabel}</Text>
            </Pressable>
          ) : null}
          {filtered.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-mute">No matches</Text>
          ) : (
            grouped.map(([g, items]) => (
              <View key={g || "_"}>
                {g ? (
                  <Text variant="label" className="px-4 pb-1 pt-3">
                    {g}
                  </Text>
                ) : null}
                {items.map(o => {
                  const selected = o.value === value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => {
                        onChange(o.value);
                        close();
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      testID={`${testID}-option-${o.value}`}
                      className={cn(
                        "flex-row items-center gap-3 px-4 py-3 active:opacity-80",
                        selected && "bg-primary-soft",
                      )}
                    >
                      {o.icon ? (
                        <MyIcon name={o.icon} size={18} color={hexOrUndefined(o.color) ?? colors.inkMute} />
                      ) : (
                        <Dot color={o.color} />
                      )}
                      <Text className={cn("min-w-0 flex-1 text-body", selected ? "text-primary" : "text-ink")} numberOfLines={1}>
                        {o.label}
                      </Text>
                      {selected ? <MyIcon name="Check" size={18} color={colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    ),
  });

  return (
    <View className={cn("w-full", className)}>
      {label ? (
        <Text variant="label" className="mb-[7px]">
          {label}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap items-center gap-2">
        {quick.length === 0 ? (
          <Text className="text-body text-ink-faint">{placeholder}</Text>
        ) : (
          quick.map(o => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => !disabled && onChange(o.value)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`${testID}-pill-${o.value}`}
                className={cn(
                  "flex-row items-center gap-2 rounded-full border px-3.5 py-2 active:opacity-80",
                  selected ? "border-primary bg-primary-soft" : "border-border bg-surface",
                )}
              >
                {o.icon ? (
                  <MyIcon name={o.icon} size={15} color={hexOrUndefined(o.color) ?? (selected ? colors.primary : colors.inkMute)} />
                ) : (
                  <Dot color={o.color} />
                )}
                <Text className={cn("text-sm", selected ? "text-primary" : "text-ink")} numberOfLines={1}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })
        )}
        <Pressable
          ref={triggerRef}
          onPress={() => !disabled && openOverlay()}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={viewAllLabel}
          testID={`${testID}-view-all`}
          className={cn(
            "flex-row items-center gap-1.5 rounded-full border border-dashed border-border bg-surface-alt px-3.5 py-2 active:opacity-80",
            disabled && "opacity-50",
          )}
        >
          <MyIcon name="Ellipsis" size={15} color={colors.inkMute} />
          <Text className="text-sm text-ink-mute">{viewAllLabel}</Text>
        </Pressable>
      </View>
      {error ? <Text className="mt-1.5 text-caption text-danger">{error}</Text> : null}
    </View>
  );
}
