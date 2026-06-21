/**
 * Badge — pill / tag primitive.
 * Pass `iconName` (MyIcon / lucide name — preferred) or an `icon` component.
 *
 *   <Badge tone="success" label="+4.2%" iconName="TrendingUp" />
 */
import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";

export type BadgeTone = "primary" | "success" | "danger" | "info" | "neutral";

const BG: Record<BadgeTone, string> = {
  primary: "bg-primary-soft",
  success: "bg-success-soft",
  danger: "bg-danger-soft",
  info: "bg-info-soft",
  neutral: "bg-surface-alt",
};
const FG: Record<BadgeTone, string> = {
  primary: "text-primary-deep",
  success: "text-success",
  danger: "text-danger",
  info: "text-info",
  neutral: "text-ink-mute",
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  iconName?: string;
  icon?: LucideIcon;
  className?: string;
  testID?: string;
  selectable?: boolean;
}

export function Badge({
  label,
  tone = "primary",
  iconName,
  icon: Icon,
  className = "",
  testID = "badge",
  selectable = false,
}: BadgeProps) {
  const { colors } = useTheme();
  const iconColor = {
    primary: colors.primaryDeep,
    success: colors.success,
    danger: colors.danger,
    info: colors.info,
    neutral: colors.inkMute,
  }[tone];

  return (
    <View
      testID={testID}
      className={cn("flex-row items-center self-start rounded-full px-2.5 py-1", BG[tone], className)}
    >
      {iconName ? (
        <MyIcon name={iconName} size={13} color={iconColor} style={{ marginRight: 5 }} />
      ) : Icon ? (
        <Icon size={13} color={iconColor} strokeWidth={2.4} style={{ marginRight: 5 }} />
      ) : null}
      <Text selectable={selectable} className={cn("font-sans-bold text-xs", FG[tone])}>
        {label}
      </Text>
    </View>
  );
}
