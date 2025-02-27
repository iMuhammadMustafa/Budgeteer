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
      className={`p-3 flex justify-center items-center ${isValid ? "bg-primary" : "bg-primary-200"}`}
      disabled={isValid}
      onPress={onPress}
    >
      <Text className={`font-medium text-sm ml-2 ${isValid ? "" : "text-muted"}`} selectable={false}>
        {label}
      </Text>
    </Pressable>
  );
}
