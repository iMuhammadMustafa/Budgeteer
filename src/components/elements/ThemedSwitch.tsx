import { Platform, Switch, SwitchProps } from "react-native";

import { triggerHaptic } from "./Button";

interface ThemedSwitchProps extends Omit<SwitchProps, "trackColor" | "thumbColor"> {
  testID?: string;
}

/**
 * Unified Switch component with consistent theme colors and haptic feedback.
 * Wraps React Native's Switch with the app's primary palette.
 */
export default function ThemedSwitch({ onValueChange, testID, ...rest }: ThemedSwitchProps) {
  const handleValueChange = (value: boolean) => {
    triggerHaptic("selection");
    onValueChange?.(value);
  };

  return (
    <Switch
      {...rest}
      onValueChange={handleValueChange}
      trackColor={{ false: "#d1d5db", true: "#2a6e53" }}
      thumbColor={rest.value ? "#5ddc9a" : "#fff"}
      {...(Platform.OS === "web" ? { activeThumbColor: "#5ddc9a" } : {})}
      testID={testID}
    />
  );
}
