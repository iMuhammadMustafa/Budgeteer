/**
 * SectionHeader — a grouped-list label ("CASH", "SAVINGS ACCOUNT") or a section
 * heading, with an optional right-aligned actions slot.
 *
 *   <SectionHeader title="CASH" />
 *   <SectionHeader title="Accounts" variant="heading"
 *     right={<IconButton icon="Plus" … />} />
 */
import { type ReactNode } from "react";
import { View } from "react-native";

import { Text } from "./Text";
import { cn } from "./utils/cn";

export interface SectionHeaderProps {
  title: string;
  variant?: "overline" | "heading";
  right?: ReactNode;
  className?: string;
  testID?: string;
}

export function SectionHeader({ title, variant = "overline", right, className, testID = "section-header" }: SectionHeaderProps) {
  return (
    <View testID={testID} className={cn("flex-row items-center justify-between", className)}>
      <Text variant={variant === "heading" ? "h3" : "overline"}>{title}</Text>
      {right ? <View className="flex-row items-center gap-1">{right}</View> : null}
    </View>
  );
}
