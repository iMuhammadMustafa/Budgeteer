/**
 * DoubleBarChart — grouped income-vs-expense bars per period. Pure RN Views.
 * Each period is a pressable group that toggles selection (others dim) and emits
 * onBarPress. Lighter fills, light y-axis, inline (text) legend, angled x-labels
 * when crowded, pulsing multi-bar loading skeleton, empty state, grow animation.
 *
 *   <DoubleBarChart data={months} onBarPress={(d, i) => drill(d)} loading={busy} />
 */
import { useEffect, useState } from "react";
import { Animated, Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Badge } from "../Badge";
import { Pulse } from "../Pulse";
import { Text } from "../Text";
import { cn } from "../utils/cn";
import { ChartLegend } from "./ChartLegend";
import { XLabels, YGrid, Y_AXIS_PAD, buildScale, compactTick, type YTickMode } from "./axis";

const SKELETON = [0.6, 0.4, 0.85, 0.5, 0.7, 0.45, 0.9, 0.55, 0.65, 0.5, 0.8, 0.6];

export interface DoubleBarDatum {
  label: string;
  income: number;
  expense: number;
}

export interface DoubleBarChartProps {
  data: DoubleBarDatum[];
  height?: number;
  bar1Color?: string;
  bar2Color?: string;
  bar1Label?: string;
  bar2Label?: string;
  showAxis?: boolean;
  /** Draw the vertical y-axis line (default true). */
  showYAxis?: boolean;
  /** Horizontal (y) dashed gridlines (default true). */
  showYGrid?: boolean;
  /** Vertical (x) dashed gridlines, one per group (default false — they bisect bars). */
  showXGrid?: boolean;
  /** Approx. number of y-ticks in "nice" mode (default 4). */
  yTicks?: number;
  /** "nice" → rounded values; "count" → one tick per group. */
  yTickMode?: YTickMode;
  selectedIndex?: number | null;
  onBarPress?: (d: DoubleBarDatum, i: number) => void;
  formatValue?: (n: number) => string;
  loading?: boolean;
  animated?: boolean;
  skeletonBars?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
  showValues?: boolean;
}

export function DoubleBarChart({
  data,
  height = 160,
  bar1Color,
  bar2Color,
  bar1Label = "Bar 1",
  bar2Label = "Bar 2",
  showAxis = true,
  showYAxis = true,
  showYGrid = true,
  showXGrid = false,
  yTicks = 4,
  yTickMode = "nice",
  selectedIndex,
  formatValue = compactTick,
  onBarPress,
  loading = false,
  animated = true,
  skeletonBars,
  emptyTitle = "No earnings data yet",
  emptySubtitle,
  emptyIcon = "ChartColumnBig",
  className,
  testID = "double-bar-chart",
  showValues = false,
}: DoubleBarChartProps) {
  const { colors } = useTheme();
  const [internalSel, setInternalSel] = useState<number | null>(null);
  const [grow] = useState(() => new Animated.Value(animated ? 0 : 1));
  const fmt = formatValue ?? ((n: number) => String(n));

  useEffect(() => {
    if (animated) Animated.timing(grow, { toValue: 1, duration: 480, useNativeDriver: false }).start();
  }, [animated, grow]);

  const inc = bar1Color ?? colors.income;
  const exp = bar2Color ?? colors.expense;
  const max = Math.max(0, ...data.flatMap(d => [d.income, d.expense]));
  const leftPad = showAxis ? Y_AXIS_PAD : 0;
  const scale = buildScale(0, max, yTickMode, yTickMode === "count" ? data.length : yTicks);
  const scaleMax = showAxis ? scale.max : max;

  const legend = (
    <ChartLegend
      horizontal
      className="mb-3"
      items={[
        { label: bar1Label, color: inc },
        { label: bar2Label, color: exp },
      ]}
    />
  );

  if (loading || data.length === 0 || max <= 0) {
    return (
      <View testID={testID} className={cn("w-full", className)}>
        {legend}
        <DoubleBarChartSkeleton
          isEmpty={data.length === 0 || max <= 0}
          emptyTitle={emptyTitle}
          emptySubtitle={emptySubtitle}
          emptyIcon={emptyIcon}
          skeletonBars={skeletonBars}
          length={data.length}
          height={height}
          incomeColor={inc}
          expenseColor={exp}
          showAxis={showAxis}
        />
      </View>
    );
  }

  const selected = selectedIndex !== undefined ? selectedIndex : internalSel;
  const select = (i: number, d: DoubleBarDatum) => {
    if (selectedIndex === undefined) setInternalSel(prev => (prev === i ? null : i));
    onBarPress?.(d, i);
  };
  const plot = showValues ? height - 18 : height;

  const barH = (v: number) => {
    const h = Math.max(2, (v / scaleMax) * plot);
    return animated ? grow.interpolate({ inputRange: [0, 1], outputRange: [2, h] }) : h;
  };

  return (
    <View testID={testID} className={cn("w-full", className)}>
      {legend}
      <View style={{ height }}>
        {showAxis ? (
          <YGrid
            scale={scale}
            height={height}
            n={data.length}
            leftPad={leftPad}
            axisLine={showYAxis}
            showYGrid={showYGrid}
            showXGrid={showXGrid}
          />
        ) : null}
        <View className="flex-row items-end gap-0.5" style={{ height, paddingLeft: leftPad }}>
          {data.map((d, i) => (
            <BarGroup
              key={`${d.label}-${i}`}
              d={d}
              i={i}
              selected={selected}
              selectedIndex={selectedIndex}
              setInternalSel={setInternalSel}
              select={select}
              showValues={showValues}
              fmt={fmt}
              inc={inc}
              exp={exp}
              colors={colors}
              barH={barH}
              testID={testID}
              height={height}
            />
          ))}
        </View>
      </View>
      <XLabels labels={data.map(d => d.label)} selectedIndex={selected} leftPad={leftPad} />
    </View>
  );
}

export function DoubleBarChartSkeleton({
  skeletonBars,
  length,
  height = 160,
  incomeColor,
  expenseColor,
  isEmpty = false,
  emptyTitle = "No earnings data yet",
  emptySubtitle,
  emptyIcon = "ChartColumnBig",
  className,
  testID = "double-bar-chart-skeleton",
  showAxis = true,
}: {
  skeletonBars?: number;
  length?: number;
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
  showAxis?: boolean;
}) {
  const { colors } = useTheme();
  const n = skeletonBars ?? (length || 6);
  const inc = incomeColor ?? colors.income;
  const exp = expenseColor ?? colors.expense;
  const leftPad = showAxis ? Y_AXIS_PAD : 0;

  return (
    <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
      <View testID={testID} className={cn("w-full", className)}>
        <View className="flex-row items-end gap-0.5" style={{ height, paddingLeft: leftPad }}>
          <YGrid
            scale={buildScale(0, n, "nice", 2)}
            height={height}
            axisLine={showAxis}
            showYGrid={false}
            showLabels={false}
          />
          {Array.from({ length: n }).map((_, i) => (
            <View key={i} className="flex-1 flex-row items-end justify-center gap-0.5" style={{ height }}>
              <View
                style={{
                  height: Math.max(2, SKELETON[i % SKELETON.length] * height),
                  width: "35%",
                  backgroundColor: inc,
                  opacity: 0.3,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
              <View
                style={{
                  height: Math.max(2, SKELETON[(i + 3) % SKELETON.length] * height),
                  width: "35%",
                  backgroundColor: exp,
                  opacity: 0.3,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
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
  showValues,
  fmt,
  inc,
  exp,
  colors,
  barH,
  testID,
  height,
}: {
  d: DoubleBarDatum;
  i: number;
  selected: number | null;
  selectedIndex?: number | null;
  setInternalSel: React.Dispatch<React.SetStateAction<number | null>>;
  select: (i: number, d: DoubleBarDatum) => void;
  showValues: boolean;
  fmt: (n: number) => string;
  inc: string;
  exp: string;
  colors: any;
  barH: (v: number) => any;
  testID: string;
  height: number;
}) {
  const isSelected = selected === i;
  const targetOpacity = selected == null ? 0.8 : isSelected ? 0.9 : 0.4;
  const [opacityAnim] = useState(() => new Animated.Value(targetOpacity));

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: targetOpacity,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [targetOpacity, opacityAnim]);

  return (
    <Pressable
      testID={`${testID}-group-${i}`}
      className="flex-1 active:opacity-80"
      onPress={() => select(i, d)}
      onHoverIn={() => {
        if (selectedIndex === undefined) setInternalSel(i);
      }}
      onHoverOut={() => {
        if (selectedIndex === undefined) setInternalSel(null);
      }}
    >
      <View className="w-full flex-row items-end justify-center gap-0.5" style={{ height }}>
        <View className="items-center" style={{ width: "35%" }}>
          {showValues ? (
            <Text className="mb-0.5 font-mono text-[10px] text-ink-faint" numberOfLines={1}>
              {fmt(d.income)}
            </Text>
          ) : null}
          <Animated.View
            style={{
              height: barH(d.income),
              width: "100%",
              backgroundColor: inc,
              opacity: opacityAnim,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              ...(isSelected && { borderWidth: 1.5, borderColor: colors.ink, borderBottomWidth: 0 }),
            }}
          />
        </View>
        <View className="items-center" style={{ width: "35%" }}>
          {showValues ? (
            <Text className="mb-0.5 font-mono text-[10px] text-ink-faint" numberOfLines={1}>
              {fmt(d.expense)}
            </Text>
          ) : null}
          <Animated.View
            style={{
              height: barH(d.expense),
              width: "100%",
              backgroundColor: exp,
              opacity: opacityAnim,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              ...(isSelected && { borderWidth: 1.5, borderColor: colors.ink, borderBottomWidth: 0 }),
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}
