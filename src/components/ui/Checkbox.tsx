/**
 * Checkbox — boolean form control with an optional label and selection haptic.
 *
 *   <Checkbox checked={on} onChange={setOn} label="Include transfers" />
 */
import { Pressable, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { Text } from "./Text";
import { cn } from "./utils/cn";
import { triggerHaptic, type HapticType } from "./utils/haptic";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  haptic?: HapticType | false;
  className?: string;
  testID?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  haptic = "selection",
  className,
  testID = "checkbox",
}: CheckboxProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (haptic) triggerHaptic(haptic);
        onChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      testID={testID}
      className={cn("flex-row items-center gap-2.5", disabled ? "opacity-50" : "active:opacity-80", className)}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border ${
          checked ? "border-primary bg-primary" : "border-border-strong bg-surface"
        }`}
      >
        {checked ? <MyIcon name="Check" size={14} color="#FFFFFF" /> : null}
      </View>
      {label ? <Text className="text-body text-ink">{label}</Text> : null}
    </Pressable>
  );
}
