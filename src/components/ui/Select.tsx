/**
 * Select — value picker built on the overlay core (via usePresentedOverlay).
 * Single or multi select, with optional search (auto when >5 options), grouping,
 * custom option rendering, a clear affordance, and an "add new" row. Presentation
 * is chosen per call site via `present`: `auto` (default) is responsive — anchored
 * Popover on wide screens (≥640px, any platform), bottom Sheet on narrow ones — or
 * force `popover` / `sheet` / `dialog`. Trigger looks like an Input.
 *
 *   <Select label="Account" options={accts} value={id} onChange={setId} />
 *   <Select multiple values={ids} onChange={setIds} options={cats} groupBy={c => c.group!} />
 */
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface SelectOption {
  id: string;
  label: string;
  value?: unknown;
  icon?: string;
  iconColor?: string;
  detail?: string;
  disabled?: boolean;
  group?: string;
}

export type SelectPresent = OverlayPresent;

export interface SelectProps {
  options: SelectOption[];
  /** Single-select value (option id). */
  value?: string | null;
  /** Multi-select values (option ids); used when `multiple`. */
  values?: string[];
  onChange: (next: string | string[] | null) => void;
  multiple?: boolean;
  /** Force the search field; defaults to auto (options.length > 5). */
  searchable?: boolean;
  clearable?: boolean;
  /** "auto" (default): popover ≥640px wide, sheet below. Or force popover/sheet/dialog. */
  present?: SelectPresent;
  groupBy?: (o: SelectOption) => string;
  renderOption?: (o: SelectOption, state: { selected: boolean }) => React.ReactNode;
  addNew?: { label: string; onPress: () => void };
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Popover only: match the trigger's width (default true). */
  matchTriggerWidth?: boolean;
  className?: string;
  testID?: string;
}

export function Select({
  options,
  value,
  values,
  onChange,
  multiple = false,
  searchable,
  clearable = false,
  present,
  groupBy,
  renderOption,
  addNew,
  label,
  placeholder = "Select…",
  error,
  disabled = false,
  matchTriggerWidth = true,
  className,
  testID = "select",
}: SelectProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const showSearch = searchable ?? options.length > 5;
  const selectedIds = multiple ? (values ?? []) : value != null ? [value] : [];
  const selectedSet = new Set(selectedIds);
  const hasValue = selectedIds.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Match the items themselves (label + detail), not their group headings.
    return options.filter(o => o.label.toLowerCase().includes(q) || (o.detail?.toLowerCase().includes(q) ?? false));
  }, [options, query]);

  // Dev guard: duplicate option ids silently break list reconciliation.
  useEffect(() => {
    if (!__DEV__) return;
    const seen = new Set<string>();
    for (const o of options) {
      if (seen.has(o.id)) {
        console.warn(`Select: duplicate option id "${o.id}" — option ids must be unique.`);
        break;
      }
      seen.add(o.id);
    }
  }, [options]);

  const triggerText = multiple
    ? selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
        ? (options.find(o => o.id === selectedIds[0])?.label ?? placeholder)
        : `${selectedIds.length} selected`
    : (options.find(o => o.id === value)?.label ?? placeholder);

  const renderRow = (o: SelectOption, onPick: (o: SelectOption) => void) => {
    const selected = selectedSet.has(o.id);
    if (renderOption) {
      return (
        <Pressable
          key={o.id}
          onPress={() => onPick(o)}
          disabled={o.disabled}
          testID={`${testID}-option-${o.id}`}
          className={cn("active:opacity-80", o.disabled && "opacity-40")}
        >
          {renderOption(o, { selected })}
        </Pressable>
      );
    }
    return (
      <Pressable
        key={o.id}
        onPress={() => onPick(o)}
        disabled={o.disabled}
        testID={`${testID}-option-${o.id}`}
        className={cn(
          "flex-row items-center gap-3 px-4 py-2.5 active:opacity-80",
          selected && "bg-primary-soft",
          o.disabled && "opacity-40",
        )}
      >
        {o.icon ? <MyIcon name={o.icon} size={18} color={o.iconColor ?? colors.inkMute} /> : null}
        <View className="min-w-0 flex-1">
          <Text
            className={cn("text-body", selected ? "font-sans-semibold text-primary-deep" : "text-ink")}
            numberOfLines={1}
          >
            {o.label}
          </Text>
          {o.detail ? (
            <Text className="text-xs text-ink-mute" numberOfLines={1}>
              {o.detail}
            </Text>
          ) : null}
        </View>
        {selected ? (
          <MyIcon name="Check" size={18} color={colors.primary} />
        ) : multiple ? (
          <MyIcon name="Square" size={18} color={colors.inkFaint} />
        ) : null}
      </Pressable>
    );
  };

  const rows = (onPick: (o: SelectOption) => void) => {
    if (filtered.length === 0) {
      return <Text className="px-4 py-6 text-center text-sm text-ink-mute">No matches</Text>;
    }
    if (!groupBy) return filtered.map(o => renderRow(o, onPick));
    const groups = new Map<string, SelectOption[]>();
    filtered.forEach(o => {
      const g = groupBy(o);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(o);
    });
    return Array.from(groups.entries()).map(([g, items]) => (
      <View key={g}>
        <Text variant="overline" className="px-4 pb-1 pt-3">
          {g}
        </Text>
        {items.map(o => renderRow(o, onPick))}
      </View>
    ));
  };

  const { triggerRef, openOverlay, isOpen } = usePresentedOverlay({
    present,
    title: label,
    matchTriggerWidth,
    onClose: () => setQuery(""),
    renderContent: (close, contentMaxHeight) => {
      const onPick = (o: SelectOption) => {
        if (o.disabled) return;
        if (multiple) {
          onChange(selectedSet.has(o.id) ? selectedIds.filter(id => id !== o.id) : [...selectedIds, o.id]);
        } else {
          onChange(o.id);
          close();
        }
      };
      return (
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            style={{ maxHeight: contentMaxHeight - (showSearch ? 45 : 0) }}
          >
            {addNew ? (
              <Pressable
                onPress={addNew.onPress}
                testID={`${testID}-add-new`}
                className="flex-row items-center gap-2 border-b border-border px-4 py-2.5 active:opacity-80"
              >
                <MyIcon name="Plus" size={18} color={colors.primary} />
                <Text className="font-sans-semibold text-body text-primary">{addNew.label}</Text>
              </Pressable>
            ) : null}
            {rows(onPick)}
          </ScrollView>
        </View>
      );
    },
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
          onPress={() => {
            if (!disabled) openOverlay();
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          testID={testID}
          className="min-w-0 flex-1 flex-row items-center gap-2 px-3 py-3 active:opacity-90"
        >
          <Text className={cn("min-w-0 flex-1 text-body", hasValue ? "text-ink" : "text-ink-faint")} numberOfLines={1}>
            {triggerText}
          </Text>
          {addNew ? (
            <Pressable onPress={addNew.onPress} testID={`${testID}-add-new`} className="active:opacity-80">
              <MyIcon name="Plus" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : null}
          <MyIcon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} color={colors.inkFaint} />
        </Pressable>
        {clearable && hasValue ? (
          <Pressable
            onPress={() => {
              onChange(multiple ? [] : null);
              setQuery("");
            }}
            accessibilityLabel="Clear selection"
            testID={`${testID}-clear`}
            className="px-2.5 py-3 active:opacity-40"
          >
            <MyIcon name="X" size={16} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-[5px] font-sans text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
