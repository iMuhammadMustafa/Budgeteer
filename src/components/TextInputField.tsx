import { Text, TextInput, View } from "react-native";

type TextInputFieldProps = {
  label: string;
  value: string | null;
  onChange: (text: string) => void;
  keyboardType: "default" | "numeric" | "email-address";
};

export default function TextInputField({ label, value, onChange, keyboardType }: TextInputFieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-foreground">{label}</Text>
      <TextInput
        className="text-foreground dark:bg-muted border rounded-md p-2"
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  );
}
