/**
 * ProgressBar — value/max fill on a rounded track. Pass a solid `color` (e.g. a
 * savings-bucket accent from the DB; defaults to the primary token) OR a
 * `gradient` of 2+ stops for a multi-color fill (red→amber→green health, etc.).
 * The gradient spans the fill width, so its right edge tracks the percentage.
 *
 *   <ProgressBar value={4000} max={8000} color="#3B9DD6" />
 *   <ProgressBar value={pct} max={100} gradient={["#ef4444", "#f59e0b", "#10b981"]} />
 */
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";

export interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  /** 2+ color stops for a horizontal gradient fill. Takes precedence over `color`. */
  gradient?: string[];
  trackColor?: string;
  height?: number;
  className?: string;
  testID?: string;
}

export function ProgressBar({
  value,
  max,
  color,
  gradient,
  trackColor,
  height = 6,
  className,
  testID = "progress-bar",
}: ProgressBarProps) {
  const { colors } = useTheme();
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fillStyle = { width: `${pct}%` as const, height: "100%" as const, borderRadius: 999 };
  return (
    <View
      testID={testID}
      className={cn("w-full overflow-hidden rounded-full", className)}
      style={{ height, backgroundColor: trackColor ?? colors.surfaceAlt }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      {gradient && gradient.length >= 2 ? (
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={fillStyle}
        />
      ) : (
        <View style={{ ...fillStyle, backgroundColor: color ?? colors.primary }} />
      )}
    </View>
  );
}
