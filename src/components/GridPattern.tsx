import React from "react";
import { Platform, View } from "react-native";
import Svg, { Line } from "react-native-svg";

/**
 * Subtle grid pattern overlay.
 * Web: CSS backgroundImage. Native: SVG lines.
 */
export default function GridPattern({
  width: gridWidth,
  height: gridHeight,
  isDark,
}: {
  width?: number;
  height?: number;
  isDark?: boolean;
} = {}) {
  if (Platform.OS === "web") {
    return (
      <View
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgb(var(--color-grid) / 0.025) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-grid) / 0.025) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
    );
  }

  // Native: SVG-based grid
  const w = gridWidth || 400;
  const h = gridHeight || 900;
  const spacing = 40;
  const lines: React.ReactElement[] = [];
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  for (let x = 0; x <= w; x += spacing) {
    lines.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={gridColor} strokeWidth={1} />);
  }
  for (let y = 0; y <= h; y += spacing) {
    lines.push(<Line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke={gridColor} strokeWidth={1} />);
  }

  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg width={w} height={h}>
        {lines}
      </Svg>
    </View>
  );
}
