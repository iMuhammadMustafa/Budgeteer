import { memo } from "react";
import { Text, TextInput, View } from "react-native";

type TextInputFieldProps = {
  label: string;
  value: string | null | undefined;
  onChange: (text: any) => void;
  keyboardType?: "default" | "numeric" | "email-address";
};

const areEqual = (prevProps: TextInputFieldProps, nextProps: TextInputFieldProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.keyboardType === nextProps.keyboardType
  );
};

export function TextInputFieldMemo({ label, value, onChange, keyboardType = "default" }: TextInputFieldProps) {
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

const TextInputField = memo(TextInputFieldMemo, areEqual);

export default TextInputField;
