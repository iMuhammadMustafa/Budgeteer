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
import { Animated, useWindowDimensions, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
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
  /** Fold the smallest slices beyond this count into "Other" (default 8). Also the loading legend row count. */
  maxSlices?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Draw leader-line labels (name + %) around the ring for the larger slices. */
  externalLabels?: boolean;
  showLegend?: boolean;
  /** "auto" puts the legend beside the donut on wide screens, below on narrow. */
  legendPosition?: "auto" | "right" | "bottom";
  /** Cap the legend height; it scrolls past this so a long category list doesn't run away. */
  legendMaxHeight?: number;
  /** Controlled selected slice; omit for uncontrolled internal selection. */
  selectedIndex?: number | null;
  onSlicePress?: (datum: DonutDatum, index: number) => void;
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
  maxSlices = 8,
  centerLabel,
  centerValue,
  externalLabels = false,
  showLegend = true,
  legendPosition = "auto",
  legendMaxHeight,
  selectedIndex,
  onSlicePress,
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
  const [grow] = useState(() => new Animated.Value(animated ? 0 : 1));

  useEffect(() => {
    if (animated) Animated.timing(grow, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [animated, grow]);

  const beside = legendPosition === "right" || (legendPosition === "auto" && winW >= 600);
  // External labels need horizontal room on both sides; the ring stays `size`, the canvas widens.
  const labelPad = externalLabels ? 112 : 0;
  const canvasW = size + labelPad * 2;
  const cx = canvasW / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 1;
  const rInner = rOuter - thickness;

  const frameCls = cn("gap-4", beside ? "flex-row items-center" : "items-center", className);
  const donutSlotCls = cn("items-center justify-center", beside && "flex-1");
  const legendSlotCls = cn("min-w-0 flex-1", beside ? "ml-5" : "mt-4 w-full");

  const positive = data.filter(d => d.value > 0);
  const total = positive.reduce((s, d) => s + d.value, 0);

  if (loading || total <= 0) {
    return (
      <DonutChartSkeleton
        size={size}
        thickness={thickness}
        maxSlices={maxSlices}
        showLegend={showLegend}
        legendPosition={legendPosition}
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

  const selected = selectedIndex !== undefined ? selectedIndex : internalSel;
  const select = (i: number) => {
    if (selectedIndex === undefined) setInternalSel(prev => (prev === i ? null : i)); // toggle off if re-pressed
    onSlicePress?.(colored[i], i);
  };

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

  // External leader-line labels for the larger slices (skip tiny ones + "Other" to avoid collisions).
  const LABEL_MIN_PCT = 4;
  const labelEls =
    externalLabels && !single
      ? segs
          .filter(s => s.pct >= LABEL_MIN_PCT && s.label !== "Other")
          .map((s, i) => {
            const mid = (s.start + s.end) / 2;
            const cos = Math.cos(mid);
            const sin = Math.sin(mid);
            const right = cos >= 0;
            const x0 = cx + rOuter * cos;
            const y0 = cy + rOuter * sin;
            const x1 = cx + (rOuter + 12) * cos;
            const y1 = cy + (rOuter + 12) * sin;
            // Elbow just outside the ring; the text then grows outward into the (wide) label pad.
            const x2 = right ? cx + rOuter + 16 : cx - rOuter - 16;
            const ty = Math.min(Math.max(y1, 12), size - 8);
            return {
              key: `${s.label}-${i}`,
              leader: `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${ty.toFixed(1)}`,
              tx: right ? x2 + 4 : x2 - 4,
              ty,
              anchor: right ? ("start" as const) : ("end" as const),
              text: `${s.label} ${Math.round(s.pct)}%`,
              color: s.color,
            };
          })
      : [];

  return (
    <View testID={testID} className={frameCls}>
      <View style={{ width: canvasW, height: size }} className={donutSlotCls}>
        <Animated.View
          style={{
            opacity: grow,
            transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          }}
        >
          <Svg width={canvasW} height={size}>
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
          maxHeight={legendMaxHeight}
          items={segs.map(s => ({ label: s.label, color: s.color, value: fmt(s.value), percent: s.pct }))}
          selectedIndex={selected}
          onItemPress={i => select(i)}
        />
      ) : null}
    </View>
  );
}

export function DonutChartSkeleton({
  size = 180,
  thickness = 30,
  maxSlices = 8,
  showLegend = true,
  legendPosition = "auto",
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
  maxSlices?: number;
  showLegend?: boolean;
  legendPosition?: "auto" | "right" | "bottom";
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

  const frameCls = cn("gap-4", beside ? "flex-row items-center" : "items-center", className);
  const donutSlotCls = cn("items-center justify-center", beside && "flex-1");
  const legendSlotCls = cn("min-w-0 flex-1", beside ? "ml-5" : "mt-4 w-full");

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
    <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
      <View testID={testID} className={frameCls}>
        <View style={{ width: size, height: size }} className={donutSlotCls}>
          {ghostRing}
        </View>
        {isEmpty ? (
          <View className={cn("items-center gap-1.5", beside ? "ml-5 flex-1" : "mt-4 w-full")}>
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-alt">
              <MyIcon name={emptyIcon} size={20} color={colors.inkFaint} />
            </View>
            <Text variant="caption" className="text-center font-sans-semibold">
              {emptyTitle}
            </Text>
            {emptySubtitle ? <Badge className="rounded-xl" label={emptySubtitle} tone="neutral" /> : null}
          </View>
        ) : showLegend ? (
          <View className={legendSlotCls} style={{ maxHeight: legendMaxHeight, overflow: "hidden" }}>
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
