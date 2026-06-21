/**
 * Switch — themed boolean toggle (wraps RN Switch) with a selection haptic.
 *
 *   <Switch value={on} onValueChange={setOn} />
 */
import { Platform, Switch as RNSwitch } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";
import { triggerHaptic, type HapticType } from "./utils/haptic";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  haptic?: HapticType | false;
  testID?: string;
}

export function Switch({ value, onValueChange, disabled = false, haptic = "selection", testID = "switch" }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      value={value}
      disabled={disabled}
      onValueChange={v => {
        if (haptic) triggerHaptic(haptic);
        onValueChange(v);
      }}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor={Platform.OS === "android" ? (value ? colors.primaryDeep : colors.surface) : undefined}
      ios_backgroundColor={colors.borderStrong}
      testID={testID}
    />
  );
}
