import { Pressable, Text } from "react-native";

export default function Button({
  label,
  onPress,
  isValid = true,
  accessibilityHint,
  accessibilityState,
  className,
}: {
  isValid?: boolean;
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  accessibilityState?: any;
  className?: string;
}) {
  return (
    <Pressable
      className={`p-3 flex justify-center items-center rounded-md ${isValid ? "bg-primary" : "bg-primary-200"} -z-20 ${className}`}
      disabled={!isValid}
      onPress={onPress}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      <Text className={`font-medium text-sm ${isValid ? "" : "text-muted"}`} selectable={false}>
        {label}
      </Text>
    </Pressable>
  );
}
