import { Pressable, Text } from "react-native";

export default function Button({
  label,
  onPress,
  isValid = true,
}: {
  isValid?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`p-3 flex justify-center items-center rounded-md ${isValid ? "bg-primary" : "bg-primary-200"} -z-20`}
      disabled={!isValid}
      onPress={onPress}
    >
      <Text className={`font-medium text-sm ${isValid ? "" : "text-muted"}`} selectable={false}>
        {label}
      </Text>
    </Pressable>
  );
}
