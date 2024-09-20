import { memo } from "react";
import { Text, TextInput, View } from "react-native";

type TextInputFieldProps = {
  label: string;
  value: string | null | undefined;
  onChange: (text: any) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  className?: string;
};

const areEqual = (prevProps: TextInputFieldProps, nextProps: TextInputFieldProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.keyboardType === nextProps.keyboardType
  );
};

export function TextInputFieldMemo({
  label,
  value,
  onChange,
  keyboardType = "default",
  className,
}: TextInputFieldProps) {
  return (
    <View className={`my-1 ${className ?? ""} `}>
      <Text className="text-foreground">{label}</Text>
      <TextInput
        className="text-black border rounded-md p-3 border-gray-300 bg-white"
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const TextInputField = memo(TextInputFieldMemo, areEqual);

export default TextInputField;
