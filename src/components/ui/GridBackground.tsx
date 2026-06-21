/**
 * GridBackground — the subtle 27px paper grid, rendered behind content.
 * Theme-aware (uses the `grid` token) and self-gating on the `showGrid`
 * preference, so callers can drop it in unconditionally. Web uses a CSS
 * background-image; native uses react-native-svg lines (both perf-cheap).
 *
 * `inset` pulls the grid a few px in from every edge so its lines don't hug
 * the shell's sidebar border / screen edges.
 */
import { Platform, View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { GRID_SIZE } from "@/src/constants/layout";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function GridBackground({
  width: gridWidth,
  height: gridHeight,
  cellSize = GRID_SIZE,
  opacity = 0.5,
  inset = -5,
}: {
  width?: number;
  height?: number;
  cellSize?: number;
  opacity?: number;
  inset?: number;
} = {}) {
  const { colors, showGrid } = useTheme();
  if (!showGrid) return null;
  const line = colors.grid;
  const edges = { top: inset, left: inset, right: inset, bottom: inset } as const;

  if (Platform.OS === "web") {
    return (
      <View
        className="absolute"
        // @ts-ignore web-only style props
        style={{
          ...edges,
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          opacity,
          pointerEvents: "none",
        }}
      />
    );
  }

  const w = gridWidth || 1200;
  const h = gridHeight || 1200;
  const lines: React.ReactElement[] = [];
  for (let x = 0; x <= w; x += cellSize) {
    lines.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={line} strokeWidth={1} />);
  }
  for (let y = 0; y <= h; y += cellSize) {
    lines.push(<Line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke={line} strokeWidth={1} />);
  }

  return (
    <View className="absolute" style={{ ...edges, opacity }} pointerEvents="none">
      <Svg width={w} height={h}>
        {lines}
      </Svg>
    </View>
  );
}
