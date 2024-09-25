import { memo, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import Icon from "../lib/IonIcons";
import * as Haptics from "expo-haptics";

type TextInputFieldProps = {
  label: string;
  value: string | null | undefined;
  onChange: (text: any) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  className?: string;
  mode: "plus" | "minus";
  setMode: (mode: "plus" | "minus") => void;
  onModeChange?: (mode: "plus" | "minus") => void;
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
  mode,
  setMode,
  onModeChange,
}: TextInputFieldProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const handleLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setLayout({ width, height, x, y });
  };

  return (
    <View className={`my-1 ${className ?? ""} flex-1`}>
      <Text className="text-foreground">{label}</Text>
      <View className={`${Platform.OS === "web" ? "justify-center" : "justify-center flex-row"}`}>
        <Pressable
          className={`p-2 h-[${layout.height}px] ${mode === "minus" ? "bg-error-400" : "bg-success-400"} rounded-md justify-center ${Platform.OS === "web" ? "absolute top-0" : ""}`}
          onPress={() => {
            if (onModeChange) {
              onModeChange(mode === "plus" ? "minus" : "plus");
            }
            if (Platform.OS !== "web") {
              Haptics.selectionAsync();
            }
            if (mode === "plus") {
              setMode("minus");
            } else {
              setMode("plus");
            }
          }}
        >
          {mode === "minus" ? (
            <Icon name="Minus" className="text-gray-100" />
          ) : (
            <Icon name="Plus" className="text-gray-100" />
          )}
        </Pressable>

        <TextInput
          onLayout={handleLayout}
          className="text-black border rounded-md p-3 border-gray-300 bg-white text-end text-right flex-1"
          value={value ?? ""}
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const TextInputField = memo(TextInputFieldMemo, areEqual);

export default TextInputField;
