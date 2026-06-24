/**
 * SearchableSelect — async combobox. The trigger looks like a search field;
 * opening presents an in-overlay search box (so the keyboard never fights a
 * popover, on any platform) that calls `searchAction(query)` debounced, with
 * loading / empty states. Picking a result fires `onSelect`. Because results are
 * async, the caller owns the displayed `selectedLabel`.
 *
 *   <SearchableSelect label="Payee" selectedLabel={name}
 *     searchAction={q => svc.searchPayees(q)} onSelect={p => setPayee(p)} />
 */
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Loader } from "./Loader";
import { usePresentedOverlay, type OverlayPresent } from "./overlay/usePresentedOverlay";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface SearchableSelectOption {
  id: string;
  label: string;
  detail?: string;
  icon?: string;
  iconColor?: string;
  value?: unknown;
}

export interface SearchableSelectProps {
  /** Display label of the current selection (caller-owned, since results are async). */
  selectedLabel?: string | null;
  onSelect: (option: SearchableSelectOption) => void;
  searchAction: (query: string) => Promise<SearchableSelectOption[]>;
  debounceMs?: number;
  minChars?: number;
  present?: OverlayPresent;
  label?: string;
  placeholder?: string;
  emptyText?: string;
  error?: string;
  disabled?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
  testID?: string;
}

export function SearchableSelect({
  selectedLabel,
  onSelect,
  searchAction,
  debounceMs = 300,
  minChars = 1,
  present,
  label,
  placeholder = "Search…",
  emptyText = "No results",
  error,
  disabled = false,
  clearable = false,
  onClear,
  className,
  testID = "searchable-select",
}: SearchableSelectProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    reqRef.current++; // invalidate any in-flight request
    setQuery("");
    setResults([]);
    setLoading(false);
  };

  const runSearch = (raw: string) => {
    const t = raw.trim();
    if (t.length < minChars) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      reqRef.current++;
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const my = ++reqRef.current;
    searchAction(t)
      .then(r => {
        if (mountedRef.current && reqRef.current === my) {
          setResults(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current && reqRef.current === my) {
          setResults([]);
          setLoading(false);
        }
      });
  };

  const onQueryChange = (t: string) => {
    setQuery(t);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(t), debounceMs);
  };

  const { triggerRef, openOverlay } = usePresentedOverlay({
    present,
    title: label ?? "Search",
    onClose: reset,
    renderContent: (close, contentMaxHeight) => (
      <View className="max-w-full">
        <View className="flex-row items-center gap-2 border-b border-border px-4 py-2.5">
          <MyIcon name="Search" size={16} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder={placeholder}
            placeholderTextColor={colors.inkFaint}
            selectionColor={colors.primary}
            autoFocus
            className="flex-1 p-0 font-sans text-body text-ink"
            style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
            testID={`${testID}-search`}
          />
          {loading ? <Loader size="sm" tone="neutral" /> : null}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          style={{ maxHeight: contentMaxHeight - 45 }}
        >
          {query.trim().length < minChars ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-mute">Type to search</Text>
          ) : loading && results.length === 0 ? (
            <View className="py-6">
              <Loader size="sm" tone="neutral" label="Searching…" />
            </View>
          ) : results.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-ink-mute">{emptyText}</Text>
          ) : (
            results.map(o => (
              <Pressable
                key={o.id}
                onPress={() => {
                  onSelect(o);
                  close();
                }}
                testID={`${testID}-option-${o.id}`}
                className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-80"
              >
                {o.icon ? <MyIcon name={o.icon} size={18} color={o.iconColor ?? colors.inkMute} /> : null}
                <View className="min-w-0 flex-1">
                  <Text className="text-body text-ink" numberOfLines={1}>
                    {o.label}
                  </Text>
                  {o.detail ? (
                    <Text className="text-xs text-ink-mute" numberOfLines={1}>
                      {o.detail}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    ),
  });

  const hasValue = !!selectedLabel;
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
          testID={testID}
          className="min-w-0 flex-1 flex-row items-center gap-2 px-3 py-3 active:opacity-90"
        >
          <MyIcon name="Search" size={16} color={colors.inkFaint} />
          <Text className={cn("min-w-0 flex-1 text-body", hasValue ? "text-ink" : "text-ink-faint")} numberOfLines={1}>
            {selectedLabel || placeholder}
          </Text>
        </Pressable>
        {clearable && hasValue ? (
          <Pressable
            onPress={() => onClear?.()}
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
