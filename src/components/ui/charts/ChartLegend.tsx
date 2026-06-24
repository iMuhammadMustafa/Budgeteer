/**
 * ChartLegend — color-dot + label (+ optional value / percent) rows shared by the
 * charts. Rows are pressable when `onItemPress` is set (e.g. donut slice → drilldown).
 */
import { Pressable, View } from "react-native";

import { Text } from "../Text";
import { cn } from "../utils/cn";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string;
  percent?: number;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  onItemPress?: (index: number) => void;
  /** Highlight one row (and dim the rest) — e.g. the selected donut slice. */
  selectedIndex?: number | null;
  /** Inline wrapping row of dot+label chips (e.g. the income/expense legend). */
  horizontal?: boolean;
  className?: string;
  testID?: string;
}

export function ChartLegend({ items, onItemPress, selectedIndex, horizontal = false, className, testID = "chart-legend" }: ChartLegendProps) {
  const hasSelection = selectedIndex != null;

  // Horizontal: inline chips that size to their text (no flex-1 — that collapses in a row).
  if (horizontal) {
    return (
      <View testID={testID} className={cn("flex-row flex-wrap items-center gap-x-4 gap-y-1", className)}>
        {items.map((it, i) => (
          <View key={`${it.label}-${i}`} className="flex-row items-center gap-2">
            <View style={{ backgroundColor: it.color }} className="h-2.5 w-2.5 rounded-full" />
            <Text className="text-sm text-ink" numberOfLines={1}>
              {it.label}
              {it.value ? <Text className="font-mono text-xs text-ink-mute"> {it.value}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View testID={testID} className={cn("gap-0.5", className)}>
      {items.map((it, i) => {
        const selected = selectedIndex === i;
        const row = (
          <View className={cn("flex-row items-center gap-2", hasSelection && !selected && "opacity-40")}>
            <View style={{ backgroundColor: it.color }} className="h-2.5 w-2.5 rounded-full" />
            <Text className={cn("min-w-0 flex-1 text-sm text-ink", selected && "font-sans-semibold")} numberOfLines={1}>
              {it.label}
            </Text>
            {it.value ? <Text className="font-mono text-xs text-ink-mute">{it.value}</Text> : null}
            {typeof it.percent === "number" ? (
              <Text className="w-9 text-right font-mono text-xs text-ink-faint">{Math.round(it.percent)}%</Text>
            ) : null}
          </View>
        );
        return onItemPress ? (
          <Pressable
            key={`${it.label}-${i}`}
            onPress={() => onItemPress(i)}
            testID={`${testID}-item-${i}`}
            className={cn("rounded-md px-1.5 py-1 active:opacity-70", selected && "bg-primary-soft")}
          >
            {row}
          </Pressable>
        ) : (
          <View key={`${it.label}-${i}`} className="px-1.5 py-1">
            {row}
          </View>
        );
      })}
    </View>
  );
}
