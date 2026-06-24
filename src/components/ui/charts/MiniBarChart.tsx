/**
 * MiniBarChart — tiny non-interactive bar sparkline (e.g. landing-page preview).
 * Pure RN Views; scales to its container width.
 *
 *   <MiniBarChart values={[3, 5, 2, 8, 4, 6]} />
 */
import { View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "../utils/cn";

export interface MiniBarChartProps {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
  testID?: string;
}

export function MiniBarChart({ values, color, height = 48, className, testID = "mini-bar-chart" }: MiniBarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(1, ...values);
  return (
    <View testID={testID} className={cn("w-full flex-row items-end gap-1", className)} style={{ height }}>
      {values.map((v, i) => (
        <View
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ height: Math.max(2, (v / max) * height), backgroundColor: color ?? colors.primary }}
        />
      ))}
    </View>
  );
}
