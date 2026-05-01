import * as Haptics from "expo-haptics";
import React, { forwardRef, memo } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { twMerge } from "tailwind-merge";

import MyIcon from "./MyIcon";

// Type definitions
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";
export type HapticFeedbackType = "light" | "medium" | "heavy" | "selection" | "success" | "error" | "warning";

export interface ButtonProps {
  // Content
  children?: React.ReactNode;
  label?: string;
  bottomDescription?: string;
  textContainerClasses?: string;
  textClasses?: string;

  // Behavior
  onPress: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  loading?: boolean;

  // Styling
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;

  // Icons
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;

  // Haptic feedback
  hapticFeedback?: HapticFeedbackType | false;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: Record<string, boolean | string | undefined>;
  accessibilityRole?:
  | "button"
  | "link"
  | "text"
  | "image"
  | "none"
  | "search"
  | "adjustable"
  | "header"
  | "summary"
  | "imagebutton";

  // Legacy support
  isValid?: boolean;

  // Testing
  testID?: string;
}

// Variant styles mapping
const variantStyles = {
  primary: {
    container: "bg-primary",
    containerDisabled: "bg-primary opacity-80",
    text: "text-foreground font-medium",
    textDisabled: "text-muted-foreground",
  },
  secondary: {
    container: "bg-secondary",
    containerDisabled: "bg-secondary-200",
    text: "text-foreground font-medium",
    textDisabled: "text-muted-foreground",
  },
  outline: {
    container: "bg-transparent border border-outline-300",
    containerDisabled: "bg-transparent border border-outline-200",
    text: "text-foreground font-medium",
    textDisabled: "text-muted-foreground",
  },
  ghost: {
    container: "bg-transparent",
    containerDisabled: "bg-transparent",
    text: "text-foreground font-medium",
    textDisabled: "text-muted-foreground",
  },
  destructive: {
    container: "bg-danger-500",
    containerDisabled: "bg-danger-500/50",
    text: "text-white font-medium",
    textDisabled: "text-white/70",
  },
};

// Size styles mapping
const sizeStyles = {
  sm: {
    container: "px-3 py-2 rounded-md",
    text: "text-sm",
    iconSize: 16,
  },
  md: {
    container: "px-4 py-3 rounded-md",
    text: "text-sm",
    iconSize: 18,
  },
  lg: {
    container: "px-6 py-4 rounded-lg",
    text: "text-base",
    iconSize: 20,
  },
  icon: {
    container: "p-2 rounded-md",
    text: "text-sm",
    iconSize: 20,
  },
};

export async function triggerHaptic(type: HapticFeedbackType): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    switch (type) {
      case "light":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "selection":
        await Haptics.selectionAsync();
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {
    // Silently fail if haptics are not available
  }
}

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      children,
      label,
      bottomDescription,
      textContainerClasses,
      onPress,
      onLongPress,
      onPressOut,
      delayLongPress,
      disabled = false,
      loading = false,
      variant = "primary",
      size = "md",
      className = "",
      leftIcon,
      rightIcon,
      iconSize,
      hapticFeedback = "light",
      accessibilityLabel,
      accessibilityHint,
      accessibilityState,
      accessibilityRole = "button",
      // Legacy support
      isValid = true,
      textClasses = "",
      // Testing
      testID,
    },
    ref,
  ) => {
    // Handle legacy isValid prop
    const isDisabled = disabled || !isValid || loading;

    // Get styles for current variant and size
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    const finalIconSize = iconSize || sizeStyle.iconSize;

    const handlePress = async () => {
      if (isDisabled) return;
      if (hapticFeedback !== false) {
        await triggerHaptic(hapticFeedback);
      }
      onPress();
    };

    const handleLongPress = async () => {
      if (isDisabled) return;
      if (hapticFeedback !== false) {
        await triggerHaptic(hapticFeedback);
      }
      if (onLongPress) {
        onLongPress();
      }
    };

    // Determine container and text classes
    const containerClasses = twMerge(
      "flex flex-row justify-center items-center",
      sizeStyle.container,
      isDisabled ? variantStyle.containerDisabled : variantStyle.container,
      className,
    );

    const _textClasses =
      [sizeStyle.text, isDisabled ? variantStyle.textDisabled : variantStyle.text].join(" ") + " " + textClasses;
    const bottomDescriptionClasses = "text-foreground opacity-70 ml-8";

    // Render content
    const renderContent = () => {
      if (loading) {
        return (
          <>
            <ActivityIndicator
              size="small"
              color={isDisabled ? "rgb(var(--muted-foreground))" : "currentColor"}
              className="mr-2"
            />
            {label && (
              <Text className={_textClasses} selectable={false}>
                {label}
              </Text>
            )}
            {children && <>{children}</>}
            {bottomDescription && (
              <Text className={`${bottomDescriptionClasses} mt-1 text-xs`} selectable={false}>
                {bottomDescription}
              </Text>
            )}
          </>
        );
      }

      return (
        <>
          {leftIcon && (
            <MyIcon
              name={leftIcon}
              size={finalIconSize}
              className={`${_textClasses} ${children || label ? "mr-2" : ""}`}
            />
          )}

          <View className={textContainerClasses}>
            {label && (
              <Text className={_textClasses} selectable={false}>
                {label}
              </Text>
            )}
            {bottomDescription && (
              <Text className={`${bottomDescriptionClasses} mt-1 text-xs`} selectable={false}>
                {bottomDescription}
              </Text>
            )}
          </View>
          {children && <>{children}</>}

          {rightIcon && (
            <MyIcon
              name={rightIcon}
              size={finalIconSize}
              className={`${_textClasses} ${children || label ? "ml-2" : ""}`}
            />
          )}
        </>
      );
    };

    return (
      <Pressable
        ref={ref}
        testID={testID}
        className={containerClasses}
        disabled={isDisabled}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={onPressOut}
        delayLongPress={delayLongPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || (typeof children === "string" ? children : label)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
          ...accessibilityState,
        }}
        style={({ pressed }) => [
          {
            opacity: pressed && !isDisabled ? 0.8 : 1,
            transform: pressed && !isDisabled ? [{ scale: 0.98 }] : [{ scale: 1 }],
          },
        ]}
      >
        {renderContent()}
      </Pressable>
    );
  },
);

Button.displayName = "Button";

export default memo(Button);
