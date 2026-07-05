/**
 * DonutChart — category/group breakdown ring with a center total. Slices are
 * filled wedge Paths (each individually pressable) plus a pressable legend;
 * pressing toggles selection (re-press to clear) and emits onSlicePress, dimming
 * the rest. Pure react-native-svg + hand-rolled arc math (no d3) → identical
 * web/native. Colors resolve: datum.color → category dictionary → palette.
 * Smallest slices beyond `maxSlices` fold into "Other". Chart-shaped, colored
 * loading skeleton (pulsing) + empty state, plus an optional entry animation.
 *
 *   <DonutChart data={cats} centerLabel="Spent" centerValue="$2,140"
 *     selectedIndex={sel} onSlicePress={(d, i) => setSel(i)} loading={isLoading} />
 */
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/src/providers/ThemeProvider";
import MyIcon from "@/src/components/elements/MyIcon";

import { Badge } from "../Badge";
import { Pulse } from "../Pulse";
import { Text } from "../Text";
import { chartPalette, seriesColor } from "../theme/tokens";
import { cn } from "../utils/cn";
import { ChartLegend } from "./ChartLegend";

const TWO_PI = Math.PI * 2;
const GHOST_SEGMENTS = 5;

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  /** Fill the available vertical space (e.g. a fixed-height ChartCard body) and vertically
   * center the ring + legend, so a sparse donut sits centered rather than top-anchored with a
   * pool of empty space below it. */
  fillHeight?: boolean;
  /** Fold the smallest slices beyond this count into "Other" (default 8). Also the loading legend row count. */
  maxSlices?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Draw leader-line labels (name + %) around the ring for the larger slices. */
  externalLabels?: boolean;
  /** Always label at least this many of the largest slices, even when they fall below the
   * value threshold — so a ring of uniformly small slices isn't left completely unlabeled. */
  minExternalLabels?: number;
  showLegend?: boolean;
  /** "auto" puts the legend beside the donut on wide screens, below on narrow. */
  legendPosition?: "auto" | "right" | "bottom";
  /** Fixed legend height; scrolls internally when the rows overflow it. */
  legendHeight?: number;
  /** Cap the legend height; it scrolls past this so a long category list doesn't run away. */
  legendMaxHeight?: number;
  /** Controlled selected slice by index; omit for uncontrolled internal selection. */
  selectedIndex?: number | null;
  /** Controlled selected slice by label — stable across the internal sort/fold that makes a raw
   * index unreliable. Pass `null` for "nothing selected"; omit to leave selection uncontrolled. */
  selectedLabel?: string | null;
  onSlicePress?: (datum: DonutDatum, index: number) => void;
  /** Long-press a slice or legend row to drill into its details (tap = select, long-press = drill). */
  onSliceLongPress?: (datum: DonutDatum, index: number) => void;
  formatValue?: (n: number) => string;
  loading?: boolean;
  animated?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
}

/** Filled donut wedge between rInner and rOuter, from `start`→`end` radians. */
function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number): string {
  const pt = (rad: number, a: number) =>
    `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${pt(rOuter, start)} A ${rOuter} ${rOuter} 0 ${large} 1 ${pt(rOuter, end)} L ${pt(rInner, end)} A ${rInner} ${rInner} 0 ${large} 0 ${pt(rInner, start)} Z`;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 30,
  fillHeight = false,
  maxSlices = 8,
  centerLabel,
  centerValue,
  externalLabels = false,
  minExternalLabels = 4,
  showLegend = true,
  legendPosition = "auto",
  legendHeight,
  legendMaxHeight,
  selectedIndex,
  selectedLabel,
  onSlicePress,
  onSliceLongPress,
  formatValue,
  loading = false,
  animated = true,
  emptyTitle = "No data for this period",
  emptySubtitle,
  emptyIcon = "ChartPie",
  className,
  testID = "donut-chart",
}: DonutChartProps) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();
  const [internalSel, setInternalSel] = useState<number | null>(null);
  // Reanimated drives the entry grow (opacity + scale) on the UI thread — proper
  // driver on web too (no core-Animated JS-thread fallback / warning).
  const grow = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    grow.value = animated ? withTiming(1, { duration: 420 }) : 1;
  }, [animated, grow]);

  const growStyle = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scale: 0.92 + grow.value * 0.08 }],
  }));

  const beside = legendPosition === "right" || (legendPosition === "auto" && winW >= 600);
  // External labels need horizontal room on both sides; the ring stays `size`, the canvas widens.
  const labelPad = externalLabels ? 128 : 0;
  const canvasW = size + labelPad * 2;
  const cx = canvasW / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 1;
  const rInner = rOuter - thickness;

  const frameCls = cn(
    "gap-4",
    beside ? "flex-row items-center" : "items-center",
    fillHeight && "flex-1",
    fillHeight && !beside && "justify-center",
    className,
  );
  const donutSlotCls = cn("items-center justify-center", beside && "flex-1");
  const legendSlotCls = cn("min-w-0", beside ? "ml-5 flex-1" : "mt-4 w-full");

  const positive = data.filter(d => d.value > 0);
  const total = positive.reduce((s, d) => s + d.value, 0);

  if (loading || total <= 0) {
    return (
      <DonutChartSkeleton
        size={size}
        thickness={thickness}
        fillHeight={fillHeight}
        maxSlices={maxSlices}
        showLegend={showLegend}
        legendPosition={legendPosition}
        legendHeight={legendHeight}
        legendMaxHeight={legendMaxHeight}
        isEmpty={!loading && total <= 0}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        emptyIcon={emptyIcon}
        className={className}
        testID={testID}
      />
    );
  }

  // ---- real chart ----
  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const slices: DonutDatum[] =
    sorted.length > maxSlices
      ? [
          ...sorted.slice(0, maxSlices - 1),
          {
            label: "Other",
            value: sorted.slice(maxSlices - 1).reduce((s, d) => s + d.value, 0),
            color: colors.inkFaint,
          },
        ]
      : sorted;
  const colored = slices.map((s, i) => ({ ...s, color: seriesColor(i, s.color, s.label) }));

  // Resolve the controlled selection: an explicit index wins; otherwise a label is matched against
  // the sorted/folded slices (stable where a raw index isn't); otherwise fall back to internal state.
  const labelIndex = selectedLabel != null ? colored.findIndex(c => c.label === selectedLabel) : -1;
  const controlled = selectedIndex !== undefined || selectedLabel !== undefined;
  const selected =
    selectedIndex !== undefined
      ? selectedIndex
      : selectedLabel !== undefined
        ? labelIndex >= 0
          ? labelIndex
          : null
        : internalSel;
  const select = (i: number) => {
    if (!controlled) setInternalSel(prev => (prev === i ? null : i)); // toggle off if re-pressed
    onSlicePress?.(colored[i], i);
  };
  const drill = onSliceLongPress ? (i: number) => onSliceLongPress(colored[i], i) : undefined;

  const single = colored.length === 1;
  const pad = single ? 0 : 0.018; // small gap between slices (radians)
  const segs = colored.map((s, i) => {
    const startFrac = colored.slice(0, i).reduce((sum, p) => sum + p.value / total, 0);
    const frac = s.value / total;
    const start = -Math.PI / 2 + startFrac * TWO_PI + pad / 2;
    const end = Math.max(start, -Math.PI / 2 + (startFrac + frac) * TWO_PI - pad / 2);
    return { ...s, start, end, pct: frac * 100 };
  });

  const fmt = formatValue ?? ((n: number) => String(n));
  // Lighter by default (softer like the legacy palette); the selected slice pops, others recede.
  const dimOf = (i: number) => (selected == null ? 0.85 : selected === i ? 1 : 0.35);
  // The center reflects the selected slice, falling back to the overall total.
  const centerMain = selected != null ? fmt(colored[selected].value) : centerValue;
  const centerSub = selected != null ? colored[selected].label : centerLabel;

  // External leader-line labels: always the `minExternalLabels` largest slices (segs is sorted
  // descending), plus any others above the value threshold; "Other" is never labeled. This keeps
  // a ring of uniformly-small slices from rendering with no labels at all.
  const LABEL_MIN_PCT = maxSlices;
  const LABEL_ROW_H = 14; // min vertical gap between two labels on the same side
  const LABEL_MAX_CHARS = 11;
  const rawLabels =
    externalLabels && !single
      ? segs
          .filter(s => s.label !== "Other")
          .filter((s, i) => i < minExternalLabels || s.pct >= LABEL_MIN_PCT)
          .map(s => {
            const mid = (s.start + s.end) / 2;
            const cos = Math.cos(mid);
            const sin = Math.sin(mid);
            const right = cos >= 0;
            // Long category names can still outrun the label pad at any width, so clip the name
            // itself (not just rely on padding) — this is what was getting cut off at the canvas edge.
            const shortLabel = s.label.length > LABEL_MAX_CHARS ? `${s.label.slice(0, LABEL_MAX_CHARS - 1)}…` : s.label;
            return {
              key: s.label,
              right,
              x0: cx + rOuter * cos,
              y0: cy + rOuter * sin,
              ty: Math.min(Math.max(cy + (rOuter + 12) * sin, 12), size - 8),
              text: `${shortLabel} ${Math.round(s.pct)}%`,
              color: s.color,
            };
          })
      : [];

  // De-collide vertically per side: slices clustered in a small arc (e.g. several tiny ones near
  // the top) would otherwise stack their labels on the same y. Sort each side top→down and push
  // each label at least LABEL_ROW_H below the previous, then lift the column if it overflows.
  const spread = (arr: typeof rawLabels) => {
    arr.sort((a, b) => a.ty - b.ty);
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].ty < arr[i - 1].ty + LABEL_ROW_H) arr[i].ty = arr[i - 1].ty + LABEL_ROW_H;
    }
    const overflow = arr.length ? arr[arr.length - 1].ty - (size - 8) : 0;
    if (overflow > 0) for (const l of arr) l.ty = Math.max(12, l.ty - overflow);
    return arr;
  };
  const labelEls = [...spread(rawLabels.filter(l => l.right)), ...spread(rawLabels.filter(l => !l.right))].map(l => {
    const xElbow = l.right ? cx + rOuter + 6 : cx - rOuter - 6;
    const x2 = l.right ? cx + rOuter + 16 : cx - rOuter - 16;
    return {
      key: l.key,
      leader: `M ${l.x0.toFixed(1)} ${l.y0.toFixed(1)} L ${xElbow.toFixed(1)} ${l.ty.toFixed(1)} L ${x2.toFixed(1)} ${l.ty.toFixed(1)}`,
      tx: l.right ? x2 + 4 : x2 - 4,
      ty: l.ty,
      anchor: l.right ? ("start" as const) : ("end" as const),
      text: l.text,
      color: l.color,
    };
  });

  return (
    <View testID={testID} className={frameCls}>
      <View style={{ width: canvasW, height: size }} className={donutSlotCls}>
        <Animated.View style={growStyle}>
          <Svg width={canvasW} height={size} className="overflow-visible">
            {single ? (
              <Circle
                cx={cx}
                cy={cy}
                r={(rOuter + rInner) / 2}
                fill="none"
                stroke={segs[0].color}
                strokeWidth={thickness}
                opacity={dimOf(0)}
                onPress={() => select(0)}
                onLongPress={drill ? () => drill(0) : undefined}
              />
            ) : (
              <G>
                {segs.map((s, i) => (
                  <Path
                    key={`${s.label}-${i}`}
                    d={wedgePath(cx, cy, rOuter, rInner, s.start, s.end)}
                    fill={s.color}
                    opacity={dimOf(i)}
                    onPress={() => select(i)}
                    onLongPress={drill ? () => drill(i) : undefined}
                  />
                ))}
              </G>
            )}
            {labelEls.map(l => (
              <G key={l.key}>
                <Path d={l.leader} fill="none" stroke={l.color} strokeWidth={1} opacity={0.7} />
                <SvgText x={l.tx} y={l.ty + 3} fontSize={10} fontWeight="600" fill={colors.ink} textAnchor={l.anchor}>
                  {l.text}
                </SvgText>
              </G>
            ))}
          </Svg>
        </Animated.View>
        {centerMain || centerSub ? (
          <View className="absolute items-center px-6" pointerEvents="none">
            {centerMain ? (
              <Text className="font-mono-semibold text-h3 text-ink" numberOfLines={1}>
                {centerMain}
              </Text>
            ) : null}
            {centerSub ? (
              <Text variant="overline" numberOfLines={1} className="text-center">
                {centerSub}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {showLegend ? (
        <ChartLegend
          className={legendSlotCls}
          height={legendHeight}
          maxHeight={legendMaxHeight}
          items={segs.map(s => ({ label: s.label, color: s.color, value: fmt(s.value), percent: s.pct }))}
          selectedIndex={selected}
          onItemPress={i => select(i)}
          onItemLongPress={drill ? i => drill(i) : undefined}
        />
      ) : null}
    </View>
  );
}

export function DonutChartSkeleton({
  size = 180,
  thickness = 30,
  fillHeight = false,
  maxSlices = 8,
  showLegend = true,
  legendPosition = "auto",
  legendHeight,
  legendMaxHeight,
  isEmpty = false,
  emptyTitle = "No data for this period",
  emptySubtitle,
  emptyIcon = "ChartPie",
  className,
  testID = "donut-chart-skeleton",
}: {
  size?: number;
  thickness?: number;
  fillHeight?: boolean;
  maxSlices?: number;
  showLegend?: boolean;
  legendPosition?: "auto" | "right" | "bottom";
  legendHeight?: number;
  legendMaxHeight?: number;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();

  const beside = legendPosition === "right" || (legendPosition === "auto" && winW >= 600);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 1;
  const rInner = rOuter - thickness;

  const frameCls = cn(
    "gap-4",
    beside ? "flex-row items-center" : "items-center",
    fillHeight && "flex-1",
    fillHeight && !beside && "justify-center",
    className,
  );
  const donutSlotCls = cn("items-center justify-center", beside && "flex-1");
  const legendSlotCls = cn("min-w-0", beside ? "ml-5 flex-1" : "mt-4 w-full");

  const ghostRing = (
    <Svg width={size} height={size}>
      {Array.from({ length: GHOST_SEGMENTS }).map((_, i) => (
        <Path
          key={i}
          d={wedgePath(
            cx,
            cy,
            rOuter,
            rInner,
            -Math.PI / 2 + (i / GHOST_SEGMENTS) * TWO_PI,
            -Math.PI / 2 + ((i + 1) / GHOST_SEGMENTS) * TWO_PI,
          )}
          fill={chartPalette[i % chartPalette.length]}
          opacity={0.28}
        />
      ))}
    </Svg>
  );

  return (
    <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85} style={fillHeight ? { flex: 1 } : undefined}>
      <View testID={testID} className={frameCls}>
        <View style={{ width: size, height: size }} className={donutSlotCls}>
          {ghostRing}
        </View>
        {isEmpty ? (
          <View
            className={cn("items-center justify-center gap-1.5", beside ? "ml-5 flex-1" : "mt-4 w-full")}
            style={legendHeight ? { height: legendHeight } : undefined}
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-alt">
              <MyIcon name={emptyIcon} size={20} color={colors.inkFaint} />
            </View>
            <Text variant="caption" className="text-center font-sans-semibold">
              {emptyTitle}
            </Text>
            {emptySubtitle ? <Badge className="rounded-xl" label={emptySubtitle} tone="neutral" /> : null}
          </View>
        ) : showLegend ? (
          <View
            className={cn(legendSlotCls, "gap-[2px]")}
            style={{ height: legendHeight, maxHeight: legendMaxHeight, overflow: "hidden" }}
          >
            {Array.from({ length: maxSlices }).map((_, i) => (
              <View key={i} className="flex-row items-center gap-2 px-1.5 py-1">
                <View
                  style={{ backgroundColor: chartPalette[i % chartPalette.length], opacity: 0.5 }}
                  className="h-2.5 w-2.5 rounded-full"
                />
                <View style={{ backgroundColor: colors.surfaceAlt }} className="h-3 flex-1 rounded-full" />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pulse>
  );
}
