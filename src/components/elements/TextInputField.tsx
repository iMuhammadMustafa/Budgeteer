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
  testID?: string;
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
  testID,
}: TextInputFieldProps) {
  return (
    <View className={`my-1 ${className ?? ""}`}>
      <Text className="text-foreground">{label}</Text>
      <TextInput
        testID={testID}
        className={`text-foreground border rounded-md p-3 border-input-border ${isReadOnly ? "bg-input-bg-disabled" : "bg-input-bg"} ${multiline ? "h-20" : ""}`}
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={keyboardType}
        aria-disabled={isReadOnly}
        editable={!isReadOnly}
        placeholder={placeholder}
        placeholderClassName="text-text-tertiary"
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
}

const TextInputField = memo(TextInputFieldMemo, areEqual);

export default TextInputField;
