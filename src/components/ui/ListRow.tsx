/**
 * ListRow — the workhorse row for transactions / accounts / recurrings.
 * Left: icon tile (MyIcon name + color, from the DB record). Middle: title +
 * subtitle. Right: a mono amount (auto-colored by sign or explicit tone) and an
 * optional sub-line, or a fully custom `right` slot.
 *
 *   <ListRow iconName="ShoppingCart" iconColor="#E8857B" iconBg="#F6DAD5"
 *     title="Groceries" subtitle="Rewards Credit Card"
 *     amount={-185.89} subAmount="−$4,603.14" />
 */
import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { Text } from "./Text";
import { cn } from "./utils/cn";

export type AmountTone = "auto" | "income" | "expense" | "transfer" | "neutral";

const TONE_CLASS: Record<AmountTone, string> = {
  income: "text-income",
  expense: "text-expense",
  transfer: "text-transfer",
  neutral: "text-ink-mute",
  auto: "text-ink-mute",
};

export interface ListRowProps {
  title: string;
  /** String (rendered as a muted caption) or any node (e.g. a mono balance). */
  subtitle?: ReactNode;
  iconName?: string;
  iconShape?: "tile" | "circle";
  iconColor?: string;
  iconBg?: string;
  amount?: number;
  amountText?: string;
  subAmount?: string;
  tone?: AmountTone;
  onPress?: () => void;
  onLongPress?: () => void;
  right?: ReactNode;
  /** Drop the card chrome (border/bg/radius) so the row can sit inside another container. */
  bare?: boolean;
  className?: string;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  iconName,
  iconShape = "tile",
  iconColor,
  iconBg,
  amount,
  amountText,
  subAmount,
  tone = "auto",
  onPress,
  onLongPress,
  right,
  bare = false,
  className,
  testID = "list-row",
}: ListRowProps) {
  const { colors } = useTheme();
  const { formatCurrency } = usePrimaryCurrency();
  const resolvedTone: Exclude<AmountTone, "auto"> =
    tone !== "auto" ? tone : amount == null ? "neutral" : amount > 0 ? "income" : amount < 0 ? "expense" : "neutral";
  const display = amountText ?? (amount != null ? formatCurrency(amount) : "");

  const inner = (
    <>
      {iconName ? (
        <View
          style={{ backgroundColor: iconBg ?? colors.surfaceAlt }}
          className={`h-[42px] w-[42px] items-center justify-center ${iconShape === "circle" ? "rounded-full" : "rounded-lg"}`}
        >
          <MyIcon name={iconName} size={19} color={iconColor ?? colors.inkMute} />
        </View>
      ) : null}
      <View className={`min-w-0 flex-1 ${iconName ? "ml-[13px]" : ""}`}>
        <Text className="font-sans-semibold text-body" numberOfLines={1}>
          {title}
        </Text>
        {typeof subtitle === "string" ? (
          <Text className="mt-[2px] text-xs text-ink-mute" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : subtitle ? (
          <View className="mt-[2px]">{subtitle}</View>
        ) : null}
      </View>
      {right ? (
        <View className="ml-[10px] items-end">{right}</View>
      ) : display ? (
        <View className="ml-[10px] items-end">
          <Text className={`font-mono-semibold text-body ${TONE_CLASS[resolvedTone]}`}>{display}</Text>
          {subAmount ? <Text className="mt-[2px] font-mono text-xs text-ink-mute">{subAmount}</Text> : null}
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}
        className={cn(
          "flex-row items-center px-[15px] py-[13px]",
          !bare && "rounded-xl border border-border bg-surface",
          "active:opacity-90",
          className,
        )}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View
      testID={testID}
      className={cn(
        "flex-row items-center px-[15px] py-[13px]",
        !bare && "rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {inner}
    </View>
  );
}
