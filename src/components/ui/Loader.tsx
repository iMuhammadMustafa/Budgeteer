/**
 * Loader — brand-aware spinner. `size="full"` centers in a filling surface;
 * `sm`/`md` render inline; `overlay` floats it over the parent. `tone` sets the
 * spinner color from the semantic tokens; `color` overrides it with a raw value.
 */
import { ActivityIndicator, View } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export type LoaderTone = "primary" | "success" | "danger" | "info" | "neutral";

export interface LoaderProps {
  label?: string;
  size?: "sm" | "md" | "full";
  tone?: LoaderTone;
  color?: string;
  overlay?: boolean;
  className?: string;
  testID?: string;
}

export function Loader({
  label,
  size = "full",
  tone = "primary",
  color,
  overlay = false,
  className,
  testID = "loader",
}: LoaderProps) {
  const { colors } = useTheme();
  const spinnerSize = size === "sm" ? "small" : "large";
  const spinnerColor =
    color ??
    {
      primary: colors.primary,
      success: colors.success,
      danger: colors.danger,
      info: colors.info,
      neutral: colors.inkMute,
    }[tone];

  const content = (
    <View className="items-center justify-center gap-3">
      <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      {label ? <Text variant="caption">{label}</Text> : null}
    </View>
  );

  if (overlay) {
    return (
      <View
        testID={testID}
        className={cn("absolute inset-0 items-center justify-center bg-bg/60", className)}
        pointerEvents="none"
      >
        {content}
      </View>
    );
  }

  if (size === "full") {
    return (
      <View testID={testID} className={cn("flex-1 items-center justify-center bg-bg", className)}>
        {content}
      </View>
    );
  }
  if (size === "sm") {
    return (
      <View testID={testID} className={cn("py-0", className)}>
        {content}
      </View>
    );
  }

  return (
    <View testID={testID} className={cn("py-4", className)}>
      {content}
    </View>
  );
}
