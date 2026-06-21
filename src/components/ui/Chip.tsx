/**
 * Chip — interactive filter/selection pill (Transactions filters, active
 * filters). Selected state tints to primary; optional leading icon and a
 * remove (×) affordance. Distinct from Badge, which is non-interactive.
 *
 *   <Chip label="Income" selected={on} onPress={toggle} />
 *   <Chip label="Groceries" onRemove={clear} />
 */
import { Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic } from "./utils/haptic";

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  iconName?: string;
  className?: string;
  testID?: string;
}

export function Chip({ label, selected = false, onPress, onRemove, iconName, className, testID = "chip" }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.primaryDeep : colors.inkMute;

  const body = (
    <View className="flex-row items-center gap-1.5">
      {iconName ? <MyIcon name={iconName} size={14} color={fg} /> : null}
      <Text selectable={false} className={`font-sans-semibold text-sm ${selected ? "text-primary-deep" : "text-ink-mute"}`}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          hitSlop={8}
          onPress={() => {
            triggerHaptic("selection");
            onRemove();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          className="-mr-1 rounded-full p-0.5 active:opacity-40"
        >
          <MyIcon name="X" size={14} color={fg} />
        </Pressable>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={() => {
          triggerHaptic("selection");
          onPress();
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={cn(
          "self-start rounded-full border px-3 py-1.5",
          selected ? "border-primary bg-primary-soft" : "border-border bg-surface",
          "active:opacity-80",
          className,
        )}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View
      testID={testID}
      className={cn(
        "self-start rounded-full border px-3 py-1.5",
        selected ? "border-primary bg-primary-soft" : "border-border bg-surface",
        className,
      )}
    >
      {body}
    </View>
  );
}
