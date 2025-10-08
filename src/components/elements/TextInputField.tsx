import { memo } from "react";
import { Text, TextInput, View } from "react-native";

type TextInputFieldProps = {
  label: string;
  value: string | null | undefined;
  onChange: (text: any) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  className?: string;
  isReadOnly?: boolean;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
};

const areEqual = (prevProps: TextInputFieldProps, nextProps: TextInputFieldProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.keyboardType === nextProps.keyboardType
  );
};

function TextInputFieldMemo({
  label,
  value,
  onChange,
  keyboardType = "default",
  className,
  isReadOnly = false,
  placeholder,
  multiline = false,
  maxLength,
}: TextInputFieldProps) {
  return (
    <View className={`my-1 ${className ?? ""}`}>
      <Text className="text-foreground">{label}</Text>
      <TextInput
        className={`text-black border rounded-md p-3 border-gray-300 ${isReadOnly ? "bg-gray-200" : "bg-white"} ${multiline ? "h-20" : ""}`}
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={keyboardType}
        aria-disabled={isReadOnly}
        editable={!isReadOnly}
        placeholder={placeholder}
        placeholderClassName="text-gray-400"
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
}

const TextInputField = memo(TextInputFieldMemo, areEqual);

export default TextInputField;
