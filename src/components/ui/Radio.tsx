/**
 * Radio — single-select control (compose several into a group; the parent owns
 * which one is selected). Matches Checkbox styling with a circular dot.
 *
 *   <Radio selected={v === 'a'} onPress={() => setV('a')} label="Option A" />
 */
import { Pressable, View } from "react-native";

import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic, type HapticType } from "./utils/haptic";

export interface RadioProps {
  selected: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  haptic?: HapticType | false;
  className?: string;
  testID?: string;
}

export function Radio({
  selected,
  onPress,
  label,
  disabled = false,
  haptic = "selection",
  className,
  testID = "radio",
}: RadioProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (haptic) triggerHaptic(haptic);
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      testID={testID}
      className={cn("flex-row items-center gap-2.5", disabled ? "opacity-50" : "active:opacity-80", className)}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-primary" : "border-border-strong"
        }`}
      >
        {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </View>
      {label ? <Text className="text-body text-ink">{label}</Text> : null}
    </Pressable>
  );
}
