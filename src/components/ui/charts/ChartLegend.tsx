/**
 * ChartLegend — color-dot + label (+ optional value / percent) rows shared by the
 * charts. Rows are pressable when `onItemPress` is set (e.g. donut slice → drilldown).
 *
 * Sizing: pass `height` for a fixed-height legend or `maxHeight`/`maxWidth` to cap
 * it; when content overflows a constraint the legend becomes scrollable. A fixed
 * `height` is what lets a chart's empty/loading state match its loaded height
 * (the legend stops being a variable-height slot).
 */
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";

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
  /** Long-press a row to drill into its details (tap = select, long-press = drill). */
  onItemLongPress?: (index: number) => void;
  /** Highlight one row (and dim the rest) — e.g. the selected donut slice. */
  selectedIndex?: number | null;
  /** Inline wrapping row of dot+label chips (e.g. the income/expense legend). */
  horizontal?: boolean;
  /** Whether the legend should be scrollable (e.g. when there are too many items to fit on the screen). */
  scrollable?: boolean;
  /** Fixed legend height; scrolls internally when the rows overflow it. */
  height?: number;
  /** Cap the legend height; scrolls internally past it. */
  maxHeight?: number;
  /** Cap the legend width; an inline (horizontal) legend scrolls sideways past it. */
  maxWidth?: number;
  className?: string;
  testID?: string;
}

export function ChartLegend({
  items,
  onItemPress,
  onItemLongPress,
  selectedIndex,
  horizontal = false,
  scrollable = false,
  height,
  maxHeight,
  maxWidth,
  className,
  testID = "chart-legend",
}: ChartLegendProps) {
  const hasSelection = selectedIndex != null;
  const capped = height != null || maxHeight != null;

  // Horizontal: inline chips that size to their text (no flex-1 — that collapses in a row).
  if (horizontal) {
    const renderChip = (it: ChartLegendItem, i: number, onLayout?: (e: LayoutChangeEvent) => void) => (
      <View
        key={`${it.label}-${i}`}
        className="flex-row items-center gap-2"
        style={{ flexGrow: 1, minWidth: '30%' }}
        onLayout={onLayout}
      >
        <View style={{ backgroundColor: it.color }} className="h-2.5 w-2.5 rounded-full" />
        <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
          {it.label}
          {it.value ? <Text className="font-mono text-xs text-ink-mute"> {it.value}</Text> : null}
        </Text>
      </View>
    );

    const chips = items.map((it, i) => renderChip(it, i));

    const content = (
      <View className={cn("flex-row flex-wrap items-center gap-x-4 gap-y-1", !capped && !scrollable && className)}>
        {chips}
      </View>
    );

    // maxWidth → scroll sideways (single line); height/maxHeight → scroll vertically (keeps wrap).
    if (maxWidth != null && !capped && !scrollable) {
      return (
        <ScrollView
          testID={testID}
          horizontal
          showsHorizontalScrollIndicator={false}
          className={className}
          style={{ maxWidth }}
        >
          {content}
        </ScrollView>
      );
    }
    // scrollable: cap at 2 visible rows, scroll the rest.
    if (scrollable) {
      return (
        <ScrollableHorizontalLegend
          testID={testID}
          className={className}
          maxLines={2}
          items={items}
          renderChip={renderChip}
        />
      );
    }
    if (capped) {
      return (
        <ScrollView
          testID={testID}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          className={className}
          style={{ height, maxHeight, maxWidth }}
        >
          {content}
        </ScrollView>
      );
    }
    return <View testID={testID}>{content}</View>;
  }

  const rows = items.map((it, i) => {
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
    return onItemPress || onItemLongPress ? (
      <Pressable
        key={`${it.label}-${i}`}
        onPress={onItemPress ? () => onItemPress(i) : undefined}
        onLongPress={onItemLongPress ? () => onItemLongPress(i) : undefined}
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
  });

  if (capped) {
    return (
      <ScrollView
        testID={testID}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        className={className}
        style={{ height, maxHeight, maxWidth }}
        contentContainerStyle={{ gap: 2 }}
      >
        {rows}
      </ScrollView>
    );
  }

  return (
    <View testID={testID} className={cn("gap-0.5", className)} style={{ maxWidth }}>
      {rows}
    </View>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders horizontal chips in a flex-wrap row, measures the height of a single
 * row on first layout, then caps the container at `maxLines` rows and scrolls
 * vertically for overflow.
 */
function ScrollableHorizontalLegend({
  items,
  renderChip,
  maxLines = 2,
  testID,
  className,
}: {
  items: ChartLegendItem[];
  renderChip: (item: ChartLegendItem, index: number, onLayout?: (e: LayoutChangeEvent) => void) => ReactNode;
  maxLines?: number;
  testID?: string;
  className?: string;
}) {
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  // Measure one chip to derive row height (chip height + gap-y-1 = 4px).
  const GAP_Y = 4; // gap-y-1
  const onFirstChipLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (rowHeight != null) return; // already measured
      setRowHeight(e.nativeEvent.layout.height + GAP_Y);
    },
    [rowHeight],
  );

  // While we haven't measured yet, render invisibly to get the measurement.
  const wrappedChips = items.map((it, i) =>
    renderChip(it, i, i === 0 ? onFirstChipLayout : undefined),
  );

  const capHeight = rowHeight != null ? rowHeight * maxLines + GAP_Y : undefined;

  return (
    <ScrollView
      testID={testID}
      showsVerticalScrollIndicator
      nestedScrollEnabled
      className={`${className} custom-scrollbar`}
      style={capHeight != null ? { maxHeight: capHeight } : undefined}
    >
      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">{wrappedChips}</View>
    </ScrollView>
  );
}
