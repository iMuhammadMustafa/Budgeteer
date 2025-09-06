import * as Haptics from "expo-haptics";
import React, { forwardRef, memo } from "react";
import { ActivityIndicator, Platform, Pressable, Text } from "react-native";
import MyIcon from "./MyIcon";

// Type definitions
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type HapticFeedbackType = "light" | "medium" | "heavy" | "selection";

export interface ButtonProps {
  // Content
  children?: React.ReactNode;
  label?: string;

  // Behavior
  onPress: () => void;
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
  accessibilityState?: any;
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
}

// Variant styles mapping
const variantStyles = {
  primary: {
    container: "bg-primary",
    containerDisabled: "bg-primary-200",
    text: "text-primary-foreground font-medium",
    textDisabled: "text-muted-foreground",
  },
  secondary: {
    container: "bg-secondary",
    containerDisabled: "bg-secondary-200",
    text: "text-secondary-foreground font-medium",
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
    container: "bg-destructive",
    containerDisabled: "bg-destructive/50",
    text: "text-destructive-foreground font-medium",
    textDisabled: "text-muted-foreground",
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
};

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      children,
      label,
      onPress,
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
    },
    ref,
  ) => {
    // Handle legacy isValid prop
    const isDisabled = disabled || !isValid || loading;

    // Get styles for current variant and size
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    const finalIconSize = iconSize || sizeStyle.iconSize;

    // Handle press with haptic feedback
    const handlePress = async () => {
      if (isDisabled) return;

      // Trigger haptic feedback on non-web platforms
      if (hapticFeedback !== false && Platform.OS !== "web") {
        try {
          switch (hapticFeedback) {
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
          }
        } catch (error) {
          // Silently fail if haptics are not available
          console.warn("Haptic feedback failed:", error);
        }
      }

      onPress();
    };

    // Determine container and text classes
    const containerClasses = [
      "flex flex-row justify-center items-center",
      sizeStyle.container,
      isDisabled ? variantStyle.containerDisabled : variantStyle.container,
      className,
    ].join(" ");

    const textClasses = [sizeStyle.text, isDisabled ? variantStyle.textDisabled : variantStyle.text].join(" ");

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
            {(children || label) && (
              <Text className={textClasses} selectable={false}>
                {children || label}
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
              className={`${textClasses} ${children || label ? "mr-2" : ""}`}
            />
          )}

          {(children || label) && (
            <Text className={textClasses} selectable={false}>
              {children || label}
            </Text>
          )}

          {rightIcon && (
            <MyIcon
              name={rightIcon}
              size={finalIconSize}
              className={`${textClasses} ${children || label ? "ml-2" : ""}`}
            />
          )}
        </>
      );
    };

    return (
      <Pressable
        ref={ref}
        className={containerClasses}
        disabled={isDisabled}
        onPress={handlePress}
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
