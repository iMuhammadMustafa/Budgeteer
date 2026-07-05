/**
 * BarChart — vertical bars (e.g. 7-day expenses). Pure RN Views. Bars are
 * pressable and toggle selection (others dim), emitting onBarPress. Colors
 * resolve: datum.color → `color` → category dictionary → palette. Light y-axis
 * (gridlines + value labels), angled x-labels when crowded, pulsing multi-bar
 * loading skeleton, empty state, optional grow animation.
 *
 *   <BarChart data={days} color={colors.expense} onBarPress={(d, i) => setSel(i)} />
 */
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Badge } from "../Badge";
import { Pulse } from "../Pulse";
import { Text } from "../Text";
import { seriesColor } from "../theme/tokens";
import { cn } from "../utils/cn";
import { XLabels, YGrid, Y_AXIS_PAD, buildScale, type YTickMode } from "./axis";

const SKELETON_HEIGHTS = [0.5, 0.78, 0.42, 0.92, 0.6, 0.82, 0.55];
const BAR_WIDTH = "56%";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  height?: number;
  /** Grow to fill the available vertical space (e.g. a card stretched taller by a sibling)
   * instead of a fixed `height`. Measures its own box via onLayout; `height` is used only as
   * the initial value before the first measurement lands. */
  fillHeight?: boolean;
  color?: string;
  showValues?: boolean;
  /** Show the y-axis gridlines + value labels (default true). */
  showAxis?: boolean;
  /** Draw the vertical y-axis line (default true). */
  showYAxis?: boolean;
  /** Horizontal (y) dashed gridlines (default true). */
  showYGrid?: boolean;
  /** Vertical (x) dashed gridlines, one per bar (default false — they bisect bars). */
  showXGrid?: boolean;
  /** Approx. number of y-ticks in "nice" mode (default 4). */
  yTicks?: number;
  /** "nice" → rounded values; "count" → one tick per bar. */
  yTickMode?: YTickMode;
  selectedIndex?: number | null;
  onBarPress?: (d: BarDatum, i: number) => void;
  /** Long-press a bar to drill into its details (dashboard uses tap = select, long-press = drill). */
  onBarLongPress?: (d: BarDatum, i: number) => void;
  formatValue?: (n: number) => string;
  loading?: boolean;
  animated?: boolean;
  skeletonBars?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
}

export function BarChart({
  data,
  height = 160,
  fillHeight = false,
  color,
  showValues = false,
  showAxis = true,
  showYAxis = true,
  showYGrid = true,
  showXGrid = false,
  yTicks = 4,
  yTickMode = "nice",
  selectedIndex,
  onBarPress,
  onBarLongPress,
  formatValue,
  loading = false,
  animated = true,
  skeletonBars,
  emptyTitle = "No data for this period",
  emptySubtitle,
  emptyIcon = "ChartColumn",
  className,
  testID = "bar-chart",
}: BarChartProps) {
  const { colors } = useTheme();
  const [internalSel, setInternalSel] = useState<number | null>(null);
  // Bars grow up from the baseline. Reanimated drives the shared `grow` on the UI
  // thread (no more JS-thread `useNativeDriver:false` height animation).
  const grow = useSharedValue(animated ? 0 : 1);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useEffect(() => {
    grow.value = animated ? withTiming(1, { duration: 480 }) : 1;
  }, [animated, grow]);

  // Before the first onLayout fires (or when fillHeight is off), fall back to the fixed `height`.
  const effectiveHeight = fillHeight ? measuredHeight || height : height;
  const max = Math.max(0, ...data.map(d => d.value));
  const fmt = formatValue ?? ((n: number) => String(n));
  const leftPad = showAxis ? Y_AXIS_PAD : 0;
  const scale = buildScale(0, max, yTickMode, yTickMode === "count" ? data.length : yTicks);
  // Bars scale to the top gridline so they sit flush under it; raw max when there's no axis.
  const scaleMax = showAxis ? scale.max : max;

  if (loading || data.length === 0 || max <= 0) {
    return (
      <BarChartSkeleton
        isEmpty={data.length === 0 || max <= 0}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        emptyIcon={emptyIcon}
        className={className}
        testID={testID}
        skeletonBars={skeletonBars}
        height={effectiveHeight}
        fillHeight={fillHeight}
        color={color}
      />
    );
  }

  const selected = selectedIndex !== undefined ? selectedIndex : internalSel;
  const select = (i: number, d: BarDatum) => {
    if (selectedIndex === undefined) setInternalSel(prev => (prev === i ? null : i));
    onBarPress?.(d, i);
  };
  const plot = showValues ? effectiveHeight - 18 : effectiveHeight;

  return (
    <View testID={testID} className={cn("w-full", fillHeight && "flex-1", className)}>
      <View
        style={fillHeight ? { flex: 1 } : { height: effectiveHeight }}
        onLayout={fillHeight ? e => setMeasuredHeight(e.nativeEvent.layout.height) : undefined}
      >
        {showAxis ? (
          <YGrid
            scale={scale}
            height={effectiveHeight}
            n={data.length}
            leftPad={leftPad}
            axisLine={showYAxis}
            showYGrid={showYGrid}
            showXGrid={showXGrid}
          />
        ) : null}
        <View className="flex-row items-end gap-2" style={{ height: effectiveHeight, paddingLeft: leftPad }}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / scaleMax) * plot);
            return (
              <BarGroup
                key={`${d.label}-${i}`}
                d={d}
                i={i}
                selected={selected}
                selectedIndex={selectedIndex}
                setInternalSel={setInternalSel}
                select={select}
                onLongPress={onBarLongPress}
                showValues={showValues}
                fmt={fmt}
                color={color}
                colors={colors}
                grow={grow}
                targetHeight={h}
                testID={testID}
                height={effectiveHeight}
              />
            );
          })}
        </View>
      </View>
      <XLabels labels={data.map(d => d.label)} selectedIndex={selected} leftPad={leftPad} />
    </View>
  );
}

export function BarChartSkeleton({
  skeletonBars,
  length,
  height = 160,
  fillHeight = false,
  color,
  isEmpty = false,
  emptyTitle = "No data for this period",
  emptySubtitle,
  emptyIcon = "ChartColumn",
  className,
  testID = "bar-chart-skeleton",
  showAxis = true,
}: {
  skeletonBars?: number;
  length?: number;
  height?: number;
  fillHeight?: boolean;
  color?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
  showAxis?: boolean;
}) {
  const { colors } = useTheme();
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const n = skeletonBars ?? (length || 7);
  const leftPad = showAxis ? Y_AXIS_PAD : 0;
  const effectiveHeight = fillHeight ? measuredHeight || height : height;

  return (
    <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
      <View testID={testID} className={cn("w-full", fillHeight && "flex-1", className)}>
        <View
          className="flex-row items-end gap-2"
          style={fillHeight ? { flex: 1, paddingLeft: leftPad } : { height: effectiveHeight, paddingLeft: leftPad }}
          onLayout={fillHeight ? e => setMeasuredHeight(e.nativeEvent.layout.height) : undefined}
        >
          <YGrid
            scale={buildScale(0, n, "nice", 2)}
            height={effectiveHeight}
            axisLine={showAxis}
            showYGrid={false}
            showLabels={false}
          />
          {Array.from({ length: n }).map((_, i) => (
            <View key={i} className="flex-1 items-center justify-end" style={{ height: effectiveHeight }}>
              <View
                style={{
                  height: Math.max(2, SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length] * effectiveHeight),
                  width: BAR_WIDTH,
                  backgroundColor: color ?? colors.primary,
                  opacity: 0.3,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              />
            </View>
          ))}
        </View>
        <XLabels labels={Array.from({ length: n }).map((_, i) => String(i))} selectedIndex={null} leftPad={leftPad} />
      </View>
      {isEmpty && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="items-center gap-1.5">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface-alt">
              <MyIcon name={emptyIcon} size={24} color={colors.inkFaint} />
            </View>
            <Text variant="caption" className="text-center font-sans-semibold">
              {emptyTitle}
            </Text>
            {emptySubtitle ? <Badge className="rounded-xl" label={emptySubtitle} tone="neutral" /> : null}
          </View>
        </View>
      )}
    </Pulse>
  );
}

function BarGroup({
  d,
  i,
  selected,
  selectedIndex,
  setInternalSel,
  select,
  onLongPress,
  showValues,
  fmt,
  color,
  colors,
  grow,
  targetHeight,
  testID,
  height,
}: {
  d: BarDatum;
  i: number;
  selected: number | null;
  selectedIndex?: number | null;
  setInternalSel: React.Dispatch<React.SetStateAction<number | null>>;
  select: (i: number, d: BarDatum) => void;
  onLongPress?: (d: BarDatum, i: number) => void;
  showValues: boolean;
  fmt: (n: number) => string;
  color?: string;
  colors: any;
  grow: SharedValue<number>;
  targetHeight: number;
  testID: string;
  height: number;
}) {
  const isSelected = selected === i;
  const targetOpacity = selected == null ? 0.8 : isSelected ? 0.9 : 0.4;
  const opacity = useSharedValue(targetOpacity);

  useEffect(() => {
    opacity.value = withTiming(targetOpacity, { duration: 200 });
  }, [targetOpacity, opacity]);

  // Height interpolates from the 2px baseline to the bar's target as `grow` 0→1;
  // opacity eases on selection. Both run on the UI thread.
  const barStyle = useAnimatedStyle(() => ({
    height: 2 + grow.value * (targetHeight - 2),
    opacity: opacity.value,
  }));

  return (
    <Pressable
      testID={`${testID}-bar-${i}`}
      className="flex-1 active:opacity-80"
      onPress={() => select(i, d)}
      onLongPress={onLongPress ? () => onLongPress(d, i) : undefined}
      onHoverIn={() => {
        if (selectedIndex === undefined) setInternalSel(i);
      }}
      onHoverOut={() => {
        if (selectedIndex === undefined) setInternalSel(null);
      }}
    >
      <View className="w-full items-center justify-end" style={{ height }}>
        {showValues ? (
          <Text className="mb-1 font-mono text-[10px] text-ink-faint" numberOfLines={1}>
            {fmt(d.value)}
          </Text>
        ) : null}
        <Animated.View
          style={[
            barStyle,
            {
              width: BAR_WIDTH,
              backgroundColor: d.color ?? color ?? seriesColor(i, undefined, d.label),
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              ...(isSelected && { borderWidth: 1.5, borderColor: colors.ink }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}
