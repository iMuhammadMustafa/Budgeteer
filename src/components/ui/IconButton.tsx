/**
 * IconButton — square icon-only action (toolbar/topbar). Shares haptics with
 * Button. `accessibilityLabel` is required since there's no visible text.
 *
 *   <IconButton icon="Plus" accessibilityLabel="Add account" onPress={...} />
 */
import { ActivityIndicator, Pressable } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";
import { type HapticType } from "./utils/haptic";
import { usePressableAction } from "./utils/usePressableAction";

export type IconButtonVariant = "ghost" | "outline" | "surface" | "destructive";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";

const CONTAINER: Record<IconButtonVariant, string> = {
  ghost: "",
  outline: "border border-border-strong",
  surface: "bg-surface-alt",
  destructive: "bg-danger",
};
const PAD: Record<IconButtonSize, string> = { xs: "p-1", sm: "p-1.5", md: "p-2", lg: "p-2.5" };
const ICON_PX: Record<IconButtonSize, number> = { xs: 16, sm: 18, md: 20, lg: 24 };

export interface IconButtonProps {
  icon: string;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  haptic?: HapticType | false;
  accessibilityLabel: string;
  accessibilityHint?: string;
  className?: string;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  onLongPress,
  variant = "ghost",
  size = "md",
  disabled = false,
  loading = false,
  haptic = "light",
  accessibilityLabel,
  accessibilityHint,
  className = "",
  testID = "icon-button",
}: IconButtonProps) {
  const { colors } = useTheme();
  const { isDisabled, handlePress, handleLongPress } = usePressableAction({
    onPress,
    onLongPress,
    disabled,
    loading,
    haptic,
  });
  const iconColor = variant === "destructive" ? "#FFFFFF" : colors.ink;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      className={cn(
        "items-center justify-center rounded-lg",
        PAD[size],
        CONTAINER[variant],
        isDisabled ? "opacity-50" : "active:opacity-80",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <MyIcon name={icon} size={ICON_PX[size]} color={iconColor} />
      )}
    </Pressable>
  );
}
