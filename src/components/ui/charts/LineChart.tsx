/**
 * LineChart — a value series over time (e.g. net worth). SVG polyline + optional
 * area fill + pressable dots that toggle selection (others dim) and emit
 * onPointPress; the selected dot shows a value tooltip. Light y-axis (gridlines +
 * value labels), optional legend, angled x-labels when crowded. Width measured
 * from the container; pulsing ghost loading + empty states; fade-in animation.
 *
 *   <LineChart data={netWorth} seriesLabel="Net worth" fillArea formatValue={fmtMoney} />
 */
import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Path, Line as SvgLine, Text as SvgText } from "react-native-svg";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Badge } from "../Badge";
import { Pulse } from "../Pulse";
import { Text } from "../Text";
import { cn } from "../utils/cn";
import { ChartLegend } from "./ChartLegend";
import { XLabels, compactTick } from "./axis";

const GHOST_PATTERN = [0.45, 0.6, 0.4, 0.7, 0.5, 0.8, 0.62, 0.85];
const LEFT_PAD = 34;
const RIGHT_PAD = 8;
const PAD_Y = 14;

export interface LineDatum {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineDatum[];
  height?: number;
  color?: string;
  /** Single series-name chip above the chart. */
  seriesLabel?: string;
  /** Per-point legend (label + value) below the chart. */
  showLegend?: boolean;
  /** Draw the vertical y-axis line (default true). */
  showYAxis?: boolean;
  showDots?: boolean;
  fillArea?: boolean;
  selectedIndex?: number | null;
  onPointPress?: (d: LineDatum, i: number) => void;
  formatValue?: (n: number) => string;
  loading?: boolean;
  animated?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
}

export function LineChart({
  data,
  height = 180,
  color,
  seriesLabel,
  showLegend = false,
  showYAxis = true,
  showDots = true,
  fillArea = true,
  selectedIndex,
  onPointPress,
  formatValue,
  loading = false,
  animated = true,
  emptyTitle = "No growth data yet",
  emptySubtitle,
  emptyIcon = "ChartSpline",
  className,
  testID = "line-chart",
}: LineChartProps) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const [internalSel, setInternalSel] = useState<number | null>(null);
  const [grow] = useState(() => new Animated.Value(animated ? 0 : 1));

  useEffect(() => {
    if (animated) Animated.timing(grow, { toValue: 1, duration: 460, useNativeDriver: true }).start();
  }, [animated, grow]);

  const stroke = color ?? colors.primary;
  const fmt = formatValue ?? ((n: number) => String(n));
  const plotH = height - PAD_Y * 2;
  const innerW = Math.max(0, w - LEFT_PAD - RIGHT_PAD);
  const xAt = (i: number, n: number) => LEFT_PAD + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const isEmpty = data.length === 0 || data.every(d => d.value === 0);

  if (loading || isEmpty) {
    return (
      <View testID={testID} className={cn("w-full", className)}>
        {seriesLabel ? (
          <ChartLegend horizontal className="mb-2" items={[{ label: seriesLabel, color: stroke }]} />
        ) : null}
        <LineChartSkeleton
          isEmpty={isEmpty}
          emptyTitle={emptyTitle}
          emptySubtitle={emptySubtitle}
          emptyIcon={emptyIcon}
          length={data.length}
          height={height}
          color={stroke}
        />
      </View>
    );
  }

  const selected = selectedIndex !== undefined ? selectedIndex : internalSel;
  const select = (i: number, d: LineDatum) => {
    if (selectedIndex === undefined) setInternalSel(prev => (prev === i ? null : i));
    onPointPress?.(d, i);
  };

  const n = data.length;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const yAt = (v: number) => PAD_Y + (1 - (v - min) / span) * plotH;
  const pts = data.map((d, i) => ({ x: xAt(i, n), y: yAt(d.value) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    n > 1
      ? `${linePath} L ${pts[n - 1].x.toFixed(1)} ${height - PAD_Y} L ${pts[0].x.toFixed(1)} ${height - PAD_Y} Z`
      : "";
  const ticks = [max, (max + min) / 2, min];

  return (
    <View testID={testID} className={cn("w-full", className)} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {seriesLabel ? <ChartLegend horizontal className="mb-2" items={[{ label: seriesLabel, color: stroke }]} /> : null}
      <Animated.View style={{ height, opacity: grow }}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            {ticks.map((t, i) => {
              const y = yAt(t);
              return (
                <SvgLine
                  key={i}
                  x1={LEFT_PAD}
                  y1={y}
                  x2={w - RIGHT_PAD}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
              );
            })}
            {ticks.map((t, i) => (
              <SvgText
                key={`l${i}`}
                x={LEFT_PAD - 5}
                y={yAt(t) + 3}
                fontSize={10}
                fill={colors.inkFaint}
                textAnchor="end"
              >
                {compactTick(t)}
              </SvgText>
            ))}
            {showYAxis ? (
              <SvgLine
                x1={LEFT_PAD}
                y1={PAD_Y}
                x2={LEFT_PAD}
                y2={height - PAD_Y}
                stroke={colors.borderStrong}
                strokeWidth={1}
              />
            ) : null}
            {fillArea && n > 1 ? <Path d={areaPath} fill={stroke} opacity={0.12} /> : null}
            <Path d={linePath} fill="none" stroke={stroke} strokeWidth={2.5} />
            {showDots
              ? pts.map((p, i) => {
                  const active = selected === i;
                  return (
                    <Circle
                      key={`${data[i].label}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={active ? 6 : 4}
                      fill={active ? stroke : colors.surface}
                      stroke={stroke}
                      strokeWidth={2}
                      opacity={selected == null || active ? 1 : 0.45}
                      onPress={() => select(i, data[i])}
                    />
                  );
                })
              : null}
            {selected != null && pts[selected] ? (
              <SvgText
                x={Math.min(Math.max(pts[selected].x, LEFT_PAD + 10), w - RIGHT_PAD - 10)}
                y={Math.max(pts[selected].y - 12, 12)}
                fontSize={11}
                fontWeight="600"
                fill={colors.ink}
                textAnchor="middle"
              >
                {fmt(data[selected].value)}
              </SvgText>
            ) : null}
          </Svg>
        ) : null}
      </Animated.View>
      <XLabels labels={data.map(d => d.label)} selectedIndex={selected} leftPad={LEFT_PAD} />
      {showLegend ? (
        <ChartLegend
          className="mt-3"
          horizontal
          items={data.map(d => ({ label: d.label, color: stroke, value: fmt(d.value) }))}
        />
      ) : null}
    </View>
  );
}

export function LineChartSkeleton({
  length,
  height = 180,
  color,
  isEmpty = false,
  emptyTitle = "No growth data yet",
  emptySubtitle,
  emptyIcon = "ChartSpline",
  className,
  testID = "line-chart-skeleton",
}: {
  length?: number;
  height?: number;
  color?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  className?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);

  const stroke = color ?? colors.primary;
  const n = Math.max(GHOST_PATTERN.length, length || GHOST_PATTERN.length);
  const plotH = height - PAD_Y * 2;
  const innerW = Math.max(0, w - LEFT_PAD - RIGHT_PAD);
  const xAt = (i: number, len: number) => LEFT_PAD + (len <= 1 ? innerW / 2 : (i / (len - 1)) * innerW);

  const pts = Array.from({ length: n }).map((_, i) => ({
    x: xAt(i, n),
    y: PAD_Y + (1 - GHOST_PATTERN[i % GHOST_PATTERN.length]) * plotH,
  }));
  const dPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <Pulse duration={2400} minOpacity={0.35} maxOpacity={0.85}>
      <View testID={testID} className={cn("w-full", className)} onLayout={e => setW(e.nativeEvent.layout.width)}>
        <View style={{ height }}>
          {w > 0 ? (
            <Svg width={w} height={height}>
              <Path d={dPath} fill="none" stroke={colors.surfaceAlt} strokeWidth={3} />
              {pts.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={4} fill={stroke} opacity={0.3} />
              ))}
            </Svg>
          ) : null}
        </View>
        <XLabels labels={Array.from({ length: n }).map((_, i) => String(i))} selectedIndex={null} leftPad={LEFT_PAD} />
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
