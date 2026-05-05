import { Text, TextProps } from "react-native";
import { twMerge } from "tailwind-merge";

export type TextVariant = "body" | "heading" | "subheading" | "label" | "caption" | "error";

const variantStyles: Record<TextVariant, string> = {
  body: "text-foreground",
  heading: "text-lg font-bold text-foreground",
  subheading: "text-base font-semibold text-foreground",
  label: "text-sm font-medium text-foreground",
  caption: "text-xs text-text-secondary",
  error: "text-xs text-status-danger",
};

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
}

export default function ThemedText({
  variant = "body",
  className,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      {...rest}
      className={twMerge(variantStyles[variant], className)}
    />
  );
}
