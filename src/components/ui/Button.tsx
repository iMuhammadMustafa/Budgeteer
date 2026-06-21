/**
 * Button — primary labeled action. Icon slots take a lucide name (forwarded to
 * MyIcon); icon color is derived from the variant. Text is non-selectable;
 * press fires a haptic and long-press a (medium) haptic by default.
 *
 *   <Button label="New Transaction" leadingIcon="Plus" onPress={...} />
 *   <Button label="Delete" variant="destructive" onPress={...} loading={busy} />
 */
import { ActivityIndicator, Pressable, Text } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";
import { type HapticType } from "./utils/haptic";
import { usePressableAction } from "./utils/usePressableAction";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const CONTAINER: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-surface-alt border border-border",
  outline: "border border-border-strong",
  ghost: "",
  destructive: "bg-danger",
};
const LABEL: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  outline: "text-ink",
  ghost: "text-ink",
  destructive: "text-white",
};
const PAD: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2.5",
  lg: "px-5 py-3",
};
const TEXT_SIZE: Record<ButtonSize, string> = { sm: "text-sm", md: "text-body", lg: "text-body-lg" };
const ICON_PX: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

export interface ButtonProps {
  label: string;
  leadingIcon?: string;
  trailingIcon?: string;
  iconSize?: number;
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  haptic?: HapticType | false;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  leadingIcon,
  trailingIcon,
  iconSize,
  onPress,
  onLongPress,
  delayLongPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  haptic = "light",
  accessibilityLabel,
  accessibilityHint,
  testID = "button",
}: ButtonProps) {
  const { colors } = useTheme();
  const { isDisabled, handlePress, handleLongPress } = usePressableAction({
    onPress,
    onLongPress,
    disabled,
    loading,
    haptic,
  });
  const iconColor = variant === "primary" || variant === "destructive" ? "#FFFFFF" : colors.ink;
  const px = iconSize ?? ICON_PX[size];

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={delayLongPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-lg",
        PAD[size],
        CONTAINER[variant],
        full && "w-full",
        isDisabled ? "opacity-50" : "active:opacity-90",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : leadingIcon ? (
        <MyIcon name={leadingIcon} size={px} color={iconColor} />
      ) : null}
      <Text selectable={false} className={cn("font-sans-bold", TEXT_SIZE[size], LABEL[variant])}>
        {label}
      </Text>
      {trailingIcon && !loading ? <MyIcon name={trailingIcon} size={px} color={iconColor} /> : null}
    </Pressable>
  );
}
