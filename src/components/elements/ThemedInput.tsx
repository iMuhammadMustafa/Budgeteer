import { TextInput, TextInputProps } from "react-native";
import { twMerge } from "tailwind-merge";

interface ThemedInputProps extends TextInputProps {
  hasError?: boolean;
  className?: string;
}

export default function ThemedInput({
  hasError = false,
  className,
  editable = true,
  ...rest
}: ThemedInputProps) {
  return (
    <TextInput
      {...rest}
      editable={editable}
      className={twMerge(
        "text-foreground border rounded-md p-3 border-input-border",
        !editable ? "bg-input-bg-disabled" : "bg-input-bg",
        hasError ? "border-status-danger" : "",
        className,
      )}
      placeholderTextColor="#9ca3af"
    />
  );
}
