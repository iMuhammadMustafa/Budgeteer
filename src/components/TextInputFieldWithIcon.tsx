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
}: TextInputFieldProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const handleLayout = (event: any) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setLayout({ width, height, x, y });
  };

  return (
    <View className={`my-1 ${className ?? ""} `}>
      <Text className="text-foreground">{label}</Text>
      <View className="justify-center">
        <Pressable
          className={`p-2 h-[${layout.height}px] absolute top-0 ${mode === "minus" ? "bg-error-400" : "bg-success-400"} rounded-md justify-center`}
          onPress={() => {
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
          className="text-black border rounded-md p-3 border-gray-300 bg-white text-end "
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