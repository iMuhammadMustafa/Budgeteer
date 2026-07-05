/**
 * LineChart — a value series over time (e.g. net worth). SVG polyline + optional
 * area fill + pressable dots that toggle selection (others dim) and emit
 * onPointPress; the selected dot shows a value tooltip. Points are band-centered
 * (same model as the bar charts) so the first dot clears the y-axis and the
 * x-labels sit exactly under their dots. Dashed x/y gridlines (each toggleable),
 * "nice" or per-point y-ticks, angled x-labels when crowded. Width measured from
 * the container; pulsing ghost loading + empty states; fade-in animation.
 *
 *   <LineChart data={netWorth} seriesLabel="Net worth" fillArea formatValue={fmtMoney} />
 */
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Path, Line as SvgLine, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/src/providers/ThemeProvider";
import MyIcon from "@/src/components/elements/MyIcon";

import { Badge } from "../Badge";
import { Pulse } from "../Pulse";
import { Text } from "../Text";
import { cn } from "../utils/cn";
import { buildScale, compactTick, X_LABEL_ANGLE_THRESHOLD, XLabels, Y_AXIS_PAD, type YTickMode } from "./axis";
import { ChartLegend } from "./ChartLegend";

// SVG primitives whose props (dash offset / opacity) we drive on the UI thread.
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DRAW_DURATION = 700;

const GHOST_PATTERN = [0.45, 0.6, 0.4, 0.7, 0.5, 0.8, 0.62, 0.85];
const LEFT_PAD = Y_AXIS_PAD;
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
  /** Fixed height for the per-point legend (scrolls past it); keeps empty/loading matching. */
  legendHeight?: number;
  /** Draw the vertical y-axis line (default true). */
  showYAxis?: boolean;
  /** Horizontal (y) dashed gridlines (default true). */
  showYGrid?: boolean;
  /** Vertical (x) dashed gridlines, one per point (default true). */
  showXGrid?: boolean;
  /** Approx. number of y-ticks in "nice" mode (default 4). */
  yTicks?: number;
  /** "nice" → rounded values; "count" → one tick per data point. */
  yTickMode?: YTickMode;
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
  legendHeight,
  showYAxis = true,
  showYGrid = true,
  showXGrid = true,
  yTicks = 4,
  yTickMode = "nice",
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
  // Draw-on entry: `progress` 0→1 drives the line's stroke-dash offset (the line
  // draws itself through the dots), the area fade, and the staggered dots.
  const progress = useSharedValue(animated ? 0 : 1);

  const stroke = color ?? colors.primary;
  const fmt = formatValue ?? ((n: number) => String(n));
  const plotH = height - PAD_Y * 2;
  const innerW = Math.max(0, w - LEFT_PAD - RIGHT_PAD);
  const isEmpty = data.length === 0 || data.every(d => d.value === 0);

  const showSkeleton = loading || isEmpty;
  // The line/dots only exist once there's data AND a measured width (`w > 0`). Start
  // the draw from that moment — not on mount — otherwise the timer burns down during
  // the loading/measuring phase and the line pops in already (mostly) drawn.
  const drawable = !showSkeleton && w > 0;
  useEffect(() => {
    if (!animated) {
      progress.value = 1;
      return;
    }
    if (drawable) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: DRAW_DURATION, easing: Easing.out(Easing.cubic) });
    }
  }, [animated, drawable, progress]);

  const selected = selectedIndex !== undefined ? selectedIndex : internalSel;
  const select = (i: number, d: LineDatum) => {
    if (selectedIndex === undefined) setInternalSel(prev => (prev === i ? null : i));
    onPointPress?.(d, i);
  };

  // Loaded chart body. Kept in a closure (not top-level) so the scale math — which
  // would break on an empty value set — only runs once we have real data. The
  // width-dependent SVG/labels stay gated on `w > 0`; geometry with `w === 0` is
  // harmless (zero-width bands), it just renders nothing until the first layout.
  const renderChart = () => {
    const n = data.length;
    // Band-centered x (matches the bar charts): point i sits in the middle of band i,
    // so the first dot clears the axis and labels line up under their dots.
    const bandW = n > 0 ? innerW / n : innerW;
    const xAt = (i: number) => LEFT_PAD + (i + 0.5) * bandW;

    const vals = data.map(d => d.value);
    const scale = buildScale(Math.min(...vals), Math.max(...vals), yTickMode, yTickMode === "count" ? n : yTicks);
    const span = scale.max - scale.min || 1;
    const yAt = (v: number) => PAD_Y + (1 - (v - scale.min) / span) * plotH;
    const baseValue = Math.min(...scale.ticks);

    const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }));
    const xs = pts.map(p => p.x);
    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaPath =
      n > 1
        ? `${linePath} L ${pts[n - 1].x.toFixed(1)} ${height - PAD_Y} L ${pts[0].x.toFixed(1)} ${height - PAD_Y} Z`
        : "";
    const angled = n > X_LABEL_ANGLE_THRESHOLD;

    // Cumulative polyline length per point → total length (for the stroke-dash draw)
    // and each dot's fractional position so it fades in as the line reaches it.
    const cumLen: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      cumLen[i] = cumLen[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    }
    const pathLength = cumLen[cumLen.length - 1] || 1;
    // Scale thresholds to 0.85 so even the last dot is fully in by the time the draw finishes.
    const dotThresholds = cumLen.map(c => (c / pathLength) * 0.85);

    return (
      <>
        <View style={{ height }}>
          {w > 0 ? (
            <Svg width={w} height={height}>
              {/* vertical (x) gridlines, one per point */}
              {showXGrid
                ? xs.map((x, i) => (
                    <SvgLine
                      key={`xg${i}`}
                      x1={x}
                      y1={PAD_Y}
                      x2={x}
                      y2={height - PAD_Y}
                      stroke={colors.border}
                      strokeWidth={1}
                      strokeDasharray="3 4"
                    />
                  ))
                : null}
              {/* horizontal (y) gridlines — baseline solid, others dashed when showYGrid */}
              {scale.ticks.map((t, i) => {
                const y = yAt(t);
                const isBase = t === baseValue;
                if (!isBase && !showYGrid) return null;
                return (
                  <SvgLine
                    key={`yg${i}`}
                    x1={LEFT_PAD}
                    y1={y}
                    x2={w - RIGHT_PAD}
                    y2={y}
                    stroke={colors.border}
                    strokeWidth={isBase ? 1.5 : 1}
                    strokeDasharray={isBase ? undefined : "3 4"}
                  />
                );
              })}
              {/* y-axis value labels */}
              {scale.ticks.map((t, i) => (
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
              {fillArea && n > 1 ? <AnimatedAreaPath progress={progress} d={areaPath} fill={stroke} /> : null}
              <AnimatedLinePath progress={progress} d={linePath} length={pathLength} stroke={stroke} />
              {showDots
                ? pts.map((p, i) => {
                    const active = selected === i;
                    return (
                      <AnimatedDot
                        key={`${data[i].label}-${i}`}
                        progress={progress}
                        threshold={dotThresholds[i]}
                        cx={p.x}
                        cy={p.y}
                        r={active ? 6 : 4}
                        fill={active ? stroke : colors.surface}
                        stroke={stroke}
                        selectionOpacity={selected == null || active ? 1 : 0.45}
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
        </View>
        {w > 0 ? (
          <XLabels labels={data.map(d => d.label)} selectedIndex={selected} xPositions={xs} width={w} angled={angled} />
        ) : null}
        {showLegend ? (
          <ChartLegend
            className="mt-3"
            horizontal
            scrollable
            height={legendHeight}
            items={data.map(d => ({ label: d.label, color: stroke, value: fmt(d.value) }))}
          />
        ) : null}
      </>
    );
  };

  // Single, always-mounted measured container: onLayout stays attached to THIS node
  // from the first render so react-native-web's ResizeObserver delivers the initial
  // width. Previously the loading/empty state returned a separate, onLayout-less View
  // that React reconciled onto the same DOM node — the observer attached post-mount and
  // never fired an initial layout on web, so `w` stuck at 0 and the SVG never rendered.
  return (
    <View testID={testID} className={cn("w-full", className)} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {seriesLabel ? (
        <ChartLegend horizontal scrollable className="mb-2" items={[{ label: seriesLabel, color: stroke }]} />
      ) : null}
      {showSkeleton ? (
        <LineChartSkeleton
          isEmpty={isEmpty}
          emptyTitle={emptyTitle}
          emptySubtitle={emptySubtitle}
          emptyIcon={emptyIcon}
          length={data.length}
          height={height}
          color={stroke}
          showLegend={showLegend}
          legendHeight={legendHeight}
        />
      ) : (
        renderChart()
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Animated SVG pieces — each owns its `useAnimatedProps` so the hook lives in a
 * child that only mounts in the loaded state; the parent never skips a hook.
 * ------------------------------------------------------------------ */
function AnimatedLinePath({
  progress,
  d,
  length,
  stroke,
}: {
  progress: SharedValue<number>;
  d: string;
  length: number;
  stroke: string;
}) {
  // strokeDashoffset walks from full-length (hidden) to 0 (fully drawn).
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={2.5}
      strokeDasharray={length}
      animatedProps={animatedProps}
    />
  );
}

function AnimatedAreaPath({ progress, d, fill }: { progress: SharedValue<number>; d: string; fill: string }) {
  const animatedProps = useAnimatedProps(() => ({ opacity: 0.12 * progress.value }));
  return <AnimatedPath d={d} fill={fill} animatedProps={animatedProps} />;
}

function AnimatedDot({
  progress,
  threshold,
  cx,
  cy,
  r,
  fill,
  stroke,
  selectionOpacity,
  onPress,
}: {
  progress: SharedValue<number>;
  threshold: number;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  selectionOpacity: number;
  onPress: () => void;
}) {
  // Dot fades in over a short window once the draw reaches its position, then the
  // selection dim (selectionOpacity) takes over.
  const animatedProps = useAnimatedProps(() => {
    const appear = Math.min(1, Math.max(0, (progress.value - threshold) / 0.15));
    return { opacity: appear * selectionOpacity };
  });
  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
      animatedProps={animatedProps}
      onPress={onPress}
    />
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
  showLegend = false,
  legendHeight,
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
  showLegend?: boolean;
  legendHeight?: number;
  className?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);

  const stroke = color ?? colors.primary;
  const n = Math.max(GHOST_PATTERN.length, length || GHOST_PATTERN.length);
  const plotH = height - PAD_Y * 2;
  const innerW = Math.max(0, w - LEFT_PAD - RIGHT_PAD);
  const bandW = n > 0 ? innerW / n : innerW;
  const xAt = (i: number) => LEFT_PAD + (i + 0.5) * bandW;

  const pts = Array.from({ length: n }).map((_, i) => ({
    x: xAt(i),
    y: PAD_Y + (1 - GHOST_PATTERN[i % GHOST_PATTERN.length]) * plotH,
  }));
  const dPath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  // Reserve the same legend slot the loaded chart uses, so heights match.
  const legendSpace = showLegend ? (legendHeight ?? 28) + 12 : 0;

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
        <XLabels
          labels={Array.from({ length: n }).map((_, i) => String(i))}
          selectedIndex={null}
          xPositions={pts.map(p => p.x)}
          width={w}
        />
        {legendSpace ? <View style={{ height: legendSpace }} /> : null}
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
