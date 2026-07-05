/**
 * Shared chart axis helpers.
 *  - compactTick: short y-axis numbers ("5.7k", "21k", "0") so the gutter stays
 *    narrow and the plot sits flush against the axis.
 *  - buildScale / niceScale / evenScale: y-axis tick values. "nice" rounds to
 *    human numbers (0 / 5k / 10k …); "count" spreads an exact number of ticks
 *    (used when the caller wants one gridline per data point).
 *  - XLabels: bottom labels; auto-angles (-45°) when crowded (>8). Supports a
 *    point-aligned mode (absolute `xPositions`) so a line chart's labels sit
 *    exactly under their dots.
 *  - YGrid: horizontal gridlines + left value labels, optional vertical (x)
 *    gridlines, solid baseline, optional y-axis line. Grids are dashed and each
 *    axis is independently toggleable (showYGrid / showXGrid).
 */
import { View, type DimensionValue } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";

import { Text } from "../Text";
import { cn } from "../utils/cn";

/** Narrow gutter that fits compact tick labels and keeps the plot tight to the axis. */
export const Y_AXIS_PAD = 34;

/** Reserved heights for the x-label band (kept constant so empty/loading match the chart). */
export const X_LABELS_HEIGHT = 22;
export const X_LABELS_HEIGHT_ANGLED = 34;
export const xLabelsHeight = (angled: boolean): number => (angled ? X_LABELS_HEIGHT_ANGLED : X_LABELS_HEIGHT);

/** Default x-labels auto-angle once there are more than this many of them. */
export const X_LABEL_ANGLE_THRESHOLD = 8;

/** Compact axis number: 5680 → "5.7k", 21000 → "21k", 0 → "0". */
export function compactTick(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return `${(n / 1000).toFixed(a < 10000 ? 1 : 0)}k`;
  return `${Math.round(n)}`;
}

export type AxisScale = { min: number; max: number; ticks: number[] };
export type YTickMode = "nice" | "count";

/** Round a rough step up to the nearest 1/2/2.5/5 × 10ⁿ ("nice" number). */
function niceStep(rough: number): number {
  if (rough <= 0 || !isFinite(rough)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * pow;
}

/**
 * Human-friendly scale: snaps the domain to nice round numbers with ~`count` steps. Rather than
 * always taking the coarsest step for `count`, it evaluates the neighbouring finer nice steps too
 * and keeps whichever leaves the LEAST empty headroom above `max` while staying within a sane
 * gridline budget — so the tallest bar/point sits near the top of the plot instead of floating
 * low under a half-empty axis. Ties break toward the tick count closest to `count`.
 */
export function niceScale(min: number, max: number, count = 4): AxisScale {
  if (!(max > min)) max = min + 1;
  const target = Math.max(1, count);
  const base = niceStep((max - min) / target);
  // Candidate steps: the target-derived nice step and two finer ones below it.
  const candidates = [base, niceStep(base * 0.6), niceStep(base * 0.35)].filter(
    (s, i, a) => s > 0 && a.indexOf(s) === i,
  );

  let best: AxisScale | null = null;
  let bestScore = Infinity;
  for (const step of candidates) {
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;
    const nTicks = Math.round((niceMax - niceMin) / step) + 1;
    if (nTicks < 3 || nTicks > 8) continue; // keep the gridline count readable
    const headroom = (niceMax - max) / (niceMax - niceMin || 1); // fraction of the axis left empty
    // Prefer little headroom, then a tick count near `count`.
    const score = headroom * 100 + Math.abs(nTicks - (target + 1));
    if (score < bestScore) {
      bestScore = score;
      const ticks: number[] = [];
      for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
      best = { min: niceMin, max: niceMax, ticks };
    }
  }

  if (best) return best;
  // Fallback: original single-step behaviour (e.g. when no candidate fit the tick budget).
  const step = base;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { min: niceMin, max: niceMax, ticks };
}

/** Exactly `count` evenly-spaced ticks across [min, max] (values may not be round). */
export function evenScale(min: number, max: number, count = 4): AxisScale {
  if (!(max > min)) max = min + 1;
  const c = Math.max(1, count);
  const ticks: number[] = [];
  for (let i = 0; i <= c; i++) ticks.push(min + ((max - min) * i) / c);
  return { min, max, ticks };
}

/** Build a y-axis scale per mode. "count" ties tick count to `count` (e.g. point count). */
export function buildScale(min: number, max: number, mode: YTickMode = "nice", count = 4): AxisScale {
  return mode === "count" ? evenScale(min, max, count) : niceScale(min, max, count);
}

export function XLabels({
  labels,
  selectedIndex,
  angled = false,
  leftPad = 0,
  xPositions,
  width,
}: {
  labels: string[];
  selectedIndex?: number | null;
  angled?: boolean;
  leftPad?: number;
  /** Absolute pixel centers per label — point-aligned mode (line chart). Requires `width`. */
  xPositions?: number[];
  width?: number;
}) {
  const isAngled = angled ?? labels.length > X_LABEL_ANGLE_THRESHOLD;

  // Point-aligned mode: absolutely place each label centered on its dot's x.
  if (xPositions && width) {
    return (
      <View style={{ height: xLabelsHeight(isAngled), width }}>
        {labels.map((l, i) => {
          const cx = xPositions[i] ?? 0;
          return (
            <Text
              key={`${l}-${i}`}
              numberOfLines={1}
              className={cn("absolute text-[10px] text-ink-mute", selectedIndex === i && "font-sans-semibold text-ink")}
              style={
                isAngled
                  ? { left: cx - 23, width: 46, textAlign: "center", top: 8, transform: [{ rotate: "-45deg" }] }
                  : { left: cx - 24, width: 48, textAlign: "center", top: 4 }
              }
            >
              {l}
            </Text>
          );
        })}
      </View>
    );
  }

  if (isAngled) {
    return (
      <View className="mt-1 flex-row" style={{ height: 30, paddingLeft: leftPad }}>
        {labels.map((l, i) => (
          <View key={`${l}-${i}`} className="flex-1 items-center">
            <Text
              numberOfLines={1}
              className={cn("text-[10px] text-ink-mute", selectedIndex === i && "font-sans-semibold text-ink")}
              style={{ transform: [{ rotate: "-45deg" }], width: 46, textAlign: "center" }}
            >
              {l}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View className="mt-1.5 flex-row gap-2" style={{ paddingLeft: leftPad }}>
      {labels.map((l, i) => (
        <Text
          key={`${l}-${i}`}
          className={cn(
            "flex-1 text-center text-xs text-ink-mute",
            selectedIndex === i && "font-sans-semibold text-ink",
          )}
          numberOfLines={1}
        >
          {l}
        </Text>
      ))}
    </View>
  );
}

/**
 * Absolute gridlines + left value labels over a `height`-tall plot.
 *  - Horizontal gridlines at each `scale.ticks` value (dashed when `showYGrid`),
 *    with the lowest tick drawn as a solid baseline.
 *  - Optional vertical gridlines, one per band center (`showXGrid`, needs `n`).
 *  - Value labels render whenever `showLabels`, independent of the gridlines.
 *  - `axisLine` draws the vertical y-axis line at the gutter edge.
 */
export function YGrid({
  scale,
  height,
  n = 0,
  leftPad = Y_AXIS_PAD,
  rightPad = 0,
  format = compactTick,
  axisLine = true,
  showYGrid = true,
  showXGrid = false,
  showLabels = true,
}: {
  scale: AxisScale;
  height: number;
  /** Band count — required to draw vertical x-gridlines. */
  n?: number;
  leftPad?: number;
  rightPad?: number;
  format?: (n: number) => string;
  axisLine?: boolean;
  showYGrid?: boolean;
  showXGrid?: boolean;
  showLabels?: boolean;
}) {
  const { colors } = useTheme();
  const { min, max, ticks } = scale;
  const span = max - min || 1;
  const yOf = (v: number) => (1 - (v - min) / span) * height;
  const baseValue = ticks.length ? Math.min(...ticks) : min;

  return (
    <View className="absolute inset-0" pointerEvents="none">
      {/* Vertical x-gridlines, one centered on each band. */}
      {showXGrid && n > 0 ? (
        <View className="absolute" style={{ left: leftPad, right: rightPad, top: 0, bottom: 0 }}>
          {Array.from({ length: n }).map((_, i) => (
            <View
              key={`x${i}`}
              style={{
                position: "absolute",
                left: `${(((i + 0.5) / n) * 100).toFixed(3)}%` as DimensionValue,
                top: 0,
                bottom: 0,
                borderLeftWidth: 1,
                borderLeftColor: colors.border,
                borderStyle: "dashed",
              }}
            />
          ))}
        </View>
      ) : null}

      {/* Horizontal gridlines (baseline solid; others dashed when showYGrid). */}
      {ticks.map(t => {
        const top = yOf(t);
        if (t === baseValue) {
          return (
            <View
              key={`g${t}`}
              className="absolute"
              style={{ left: leftPad, right: rightPad, top: top - 1, height: 2, backgroundColor: colors.border }}
            />
          );
        }
        if (!showYGrid) return null;
        return (
          <View
            key={`g${t}`}
            className="absolute"
            style={{
              left: leftPad,
              right: rightPad,
              top,
              height: 0,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              borderStyle: "dashed",
            }}
          />
        );
      })}

      {/* Value labels (clamped into view so the top/bottom ticks aren't clipped). */}
      {showLabels
        ? ticks.map(t => (
            <Text
              key={`l${t}`}
              className="absolute text-[10px] text-ink-faint"
              numberOfLines={1}
              style={{
                left: 0,
                width: leftPad - 4,
                textAlign: "right",
                top: Math.min(Math.max(yOf(t) - 7, 0), height - 14),
              }}
            >
              {format(t)}
            </Text>
          ))
        : null}

      {axisLine ? (
        <View
          className="absolute"
          style={{ left: leftPad, top: 0, bottom: 0, width: 2, backgroundColor: colors.borderStrong }}
        />
      ) : null}
    </View>
  );
}
