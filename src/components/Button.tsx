import { Pressable, Text } from "react-native";

export default function Button({
  isValid,
  label,
  handleSubmit,
}: {
  isValid: boolean;
  label: string;
  handleSubmit: () => void;
}) {
  return (
    <Pressable
      className={`p-3 flex justify-center items-center ${isValid ? "bg-primary" : "bg-primary-200"}`}
      disabled={isValid}
      onPress={handleSubmit}
    >
      <Text className={`font-medium text-sm ml-2 ${isValid ? "" : "text-muted"}`} selectable={false}>
        {label}
      </Text>
    </Pressable>
  );
}
