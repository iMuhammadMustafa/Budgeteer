/**
 * GroupedIconSelect — full-list picker for a large, grouped option set (e.g.
 * transaction categories grouped by parent group). Unlike `QuickPills` there's
 * no separate inline quick-row: the trigger opens straight to a (searchable)
 * grouped list, forced into a `Sheet` by default (better for a long scrollable
 * list than an anchored popover). Each group renders as a horizontally
 * scrolling row of icon+label chips rather than a stacked column, so more
 * groups fit on screen at once. `recentGroups` (most-recent-first) reorders
 * which group heading shows first — the items within a group stay put.
 *
 *   <GroupedIconSelect label="Category" options={categoryOptions} value={id}
 *     onChange={setId} recentGroups={recentGroupNames} onAddNew={...} />
 */
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import MyIcon from "@/src/components/elements/MyIcon";

import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { cn } from "./utils/cn";
import { Text } from "./Text";

export interface GroupedOption {
  id: string;
  label: string;
  icon?: string | null;
  color?: string | null;
  group: string;
}

export interface GroupedSelectProps {
  value?: string | null;
  onChange: (id: string) => void;
  options: GroupedOption[];
  /** Group names, most-recently-used first — reorders group headings (not items within a group). */
  recentGroups?: string[];
  label?: string;
  placeholder?: string;
  /** Defaults to "sheet" — better than a small popover for a long grouped list. */
  present?: OverlayPresent;
  onAddNew?: () => void;
  addNewLabel?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  testID?: string;
  scrollableHorizontal?: boolean;
}

/** Only real hex is a valid CSS/icon color; legacy token fragments (e.g. "info-100") aren't. */
function hexOrUndefined(c?: string | null): string | undefined {
  return c && c.startsWith("#") ? c : undefined;
}

export function GroupedSelect({
  value,
  onChange,
  options,
  recentGroups = [],
  label,
  placeholder = "Select…",
  present = "sheet",
  onAddNew,
  addNewLabel = "Add new",
  error,
  disabled = false,
  className,
  testID = "grouped-icon-select",
  scrollableHorizontal = false,
}: GroupedSelectProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  console.log("options", options);

  const selected = useMemo(() => options.find(o => o.id === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const groups = useMemo(() => {
    const map = new Map<string, GroupedOption[]>();
    for (const o of filtered) {
      const g = o.group || "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    }
    const entries = Array.from(map.entries());
    const rank = (g: string) => {
      const i = recentGroups.indexOf(g);
      return i === -1 ? recentGroups.length : i;
    };
    entries.sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]));
    return entries;
  }, [filtered, recentGroups]);

  const showSearch = options.length > 8;

  const optionsRender = (items: GroupedOption[]) => {
    return items.map(o => {
      const isSelected = o.id === value;
      return (
        <Pressable
          key={o.id}
          onPress={() => {
            onChange(o.id);
            close();
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          testID={`${testID}-option-${o.id}`}
          className={cn(
            "flex-row items-center gap-2 rounded-full border px-3.5 py-2 active:opacity-80",
            isSelected ? "border-primary bg-primary-soft" : "border-border bg-surface",
          )}
        >
          {o.icon ? (
            <MyIcon
              name={o.icon}
              size={16}
              color={hexOrUndefined(o.color) ?? (isSelected ? colors.primary : colors.inkMute)}
            />
          ) : null}
          <Text className={cn("text-sm", isSelected ? "text-primary" : "text-ink")} numberOfLines={1}>
            {o.label}
          </Text>
        </Pressable>
      );
    });
  };

  const { triggerRef, openOverlay, isOpen } = usePresentedOverlay({
    present,
    title: label ?? "Select",
    onClose: () => setQuery(""),
    renderContent: (close, contentMaxHeight) => (
      <View>
        {showSearch ? (
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
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: contentMaxHeight - (showSearch ? 45 : 0) }}>
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
          {groups.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-mute">No matches</Text>
          ) : (
            groups.map(([g, items]) => (
              <View key={g} className="py-2">
                <Text variant="label" className="px-4 pb-2">
                  {g}
                </Text>
                {scrollableHorizontal ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2 px-4">
                    {optionsRender(items)}
                  </ScrollView>
                ) : (
                  <View className="flex-row flex-wrap gap-2 px-4">{optionsRender(items)}</View>
                )}
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
      <View
        ref={triggerRef}
        className={cn(
          "flex-row items-center rounded-lg border bg-surface",
          error ? "border-danger" : "border-border",
          disabled && "opacity-50",
        )}
      >
        <Pressable
          onPress={() => !disabled && openOverlay()}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          testID={testID}
          className="min-w-0 flex-1 flex-row items-center gap-2 px-3 py-3 active:opacity-90"
        >
          {selected?.icon ? (
            <MyIcon name={selected.icon} size={16} color={hexOrUndefined(selected.color) ?? colors.inkMute} />
          ) : null}
          <Text className={cn("min-w-0 flex-1 text-body", selected ? "text-ink" : "text-ink-faint")} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {onAddNew ? (
            <Pressable onPress={() => onAddNew()} testID={`${testID}-add-new-trigger`} className="active:opacity-80">
              <MyIcon name="Plus" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : null}
          <MyIcon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} color={colors.inkFaint} />
        </Pressable>
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
