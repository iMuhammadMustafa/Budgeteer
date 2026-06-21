/**
 * Divider — horizontal/vertical separator. No default margin (callers space it
 * via className/wrapper). Optional leading `inset` and a centered `label`.
 *
 *   <Divider />
 *   <Divider inset={56} />
 *   <Divider label="June 2026" />
 *   <Divider direction="vertical" />
 */
import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { cn } from "./utils/cn";

const HAIRLINE = StyleSheet.hairlineWidth;

export interface DividerProps {
  direction?: "horizontal" | "vertical";
  inset?: number;
  label?: string;
  strong?: boolean;
  className?: string;
  testID?: string;
}

export function Divider({ direction = "horizontal", inset = 0, label, strong, className, testID = "divider" }: DividerProps) {
  const lineColor = strong ? "bg-border-strong" : "bg-border";

  if (direction === "vertical") {
    return <View testID={testID} className={cn("self-stretch", lineColor, className)} style={{ width: HAIRLINE }} />;
  }

  if (label) {
    return (
      <View testID={testID} className={cn("flex-row items-center", className)} style={{ marginStart: inset }}>
        <View className={`flex-1 ${lineColor}`} style={{ height: HAIRLINE }} />
        <Text variant="overline" className="mx-3">
          {label}
        </Text>
        <View className={`flex-1 ${lineColor}`} style={{ height: HAIRLINE }} />
      </View>
    );
  }

  return <View testID={testID} className={cn(lineColor, className)} style={{ height: HAIRLINE, marginStart: inset }} />;
}
