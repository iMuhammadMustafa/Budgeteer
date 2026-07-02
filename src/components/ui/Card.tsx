/**
 * Card — the surface primitive. Soft border, ~10px radius, optional shadow.
 * Pass `onPress` to make it a pressable card (mode cards, settings rows).
 *
 *   <Card><Text variant="h3">Week's Expenses</Text>…</Card>
 *   <Card padded={false} className="overflow-hidden">…rows…</Card>
 */
import { type ReactNode } from "react";
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "./utils/cn";

export interface CardProps {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({
  children,
  padded = true,
  elevated = true,
  onPress,
  className = "",
  style,
  testID = "card",
}: CardProps) {
  const shadow = elevated
    ? Platform.select({
        ios: { shadowColor: "#28241C", shadowOpacity: 0.07, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
        android: { elevation: 1 },
        default: {},
      })
    : undefined;

  const cls = cn(
    "bg-surface border border-border rounded-xl",
    padded && "p-[22px]",
    onPress && "active:opacity-50",
    className,
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={cls} style={[shadow, style]} testID={testID}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={cls} style={[shadow, style]} testID={testID}>
      {children}
    </View>
  );
}
