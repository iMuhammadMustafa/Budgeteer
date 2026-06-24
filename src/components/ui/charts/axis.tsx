/**
 * Shared chart axis helpers.
 *  - compactTick: short y-axis numbers ("5.7k", "21k", "0") so the gutter stays
 *    narrow and the plot sits flush against the axis (full "$5,680" labels made a gap).
 *  - XLabels: bottom labels; auto-angles (-45°) when crowded (>8) so they don't clip on phones.
 *  - YGrid: faint gridlines + left value labels; gridlines start exactly at the plot edge.
 */
import { View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Text } from "../Text";
import { cn } from "../utils/cn";

/** Narrow gutter that fits compact tick labels and keeps the plot tight to the axis. */
export const Y_AXIS_PAD = 34;

/** Compact axis number: 5680 → "5.7k", 21000 → "21k", 0 → "0". */
export function compactTick(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) return `${(n / 1000).toFixed(a < 10000 ? 1 : 0)}k`;
  return `${Math.round(n)}`;
}

export function XLabels({
  labels,
  selectedIndex,
  angled,
  leftPad = 0,
}: {
  labels: string[];
  selectedIndex?: number | null;
  angled?: boolean;
  leftPad?: number;
}) {
  const isAngled = angled ?? labels.length > 8;
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
 * Absolute gridlines + left value labels; the gridline starts at x=Y_AXIS_PAD (= bars' paddingLeft).
 * `axisLine` draws the vertical y-axis line at that edge.
 */
export function YGrid({
  max,
  height,
  format = compactTick,
  axisLine = true,
  showMiddleDashes = true,
}: {
  max: number;
  height: number;
  format?: (n: number) => string;
  axisLine?: boolean;
  showMiddleDashes?: boolean;
}) {
  const { colors } = useTheme();
  // Top gridline (max) hidden; middle is dashed; bottom (0) is the solid baseline.
  const ticks = [0.5, 0];
  return (
    <View className="absolute inset-0" pointerEvents="none">
      {ticks.map(t => (
        <View
          key={t}
          className="absolute flex-row items-center"
          style={{ top: (1 - t) * height - 8, left: 0, right: 0, height: 16 }}
        >
          <Text
            className="text-[10px] text-ink-faint"
            style={{ width: Y_AXIS_PAD, textAlign: "right", paddingRight: 4 }}
            numberOfLines={1}
          >
            {format(max * t)}
          </Text>
          {t === 0 ? (
            <View className="flex-1" style={{ height: 2, backgroundColor: colors.border }} />
          ) : (
            showMiddleDashes && (
              <View
                className="flex-1"
                style={{ borderTopWidth: 1, borderTopColor: colors.border, borderStyle: "dashed" }}
              />
            )
          )}
        </View>
      ))}
      {axisLine ? (
        <View
          className="absolute"
          style={{ left: Y_AXIS_PAD, top: 0, bottom: 0, width: 2, backgroundColor: colors.borderStrong }}
        />
      ) : null}
    </View>
  );
}
