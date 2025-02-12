import { memo, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import MyIcon from "../utils/Icons.Helper";

type TextInputFieldWithIconProps = {
  label: string;
  value: string | number | null | undefined;
  onChange: (text: any) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  className?: string;
  mode: "plus" | "minus";
  setMode: (mode: "plus" | "minus") => void;
  onModeChange?: (mode: "plus" | "minus") => void;
  type: string;
};

const areEqual = (prevProps: TextInputFieldWithIconProps, nextProps: TextInputFieldWithIconProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.keyboardType === nextProps.keyboardType
  );
};

function TextInputFieldWithIconMemo({
  label,
  value,
  onChange,
  keyboardType = "default",
  className,
  mode,
  setMode,
  onModeChange,
  type,
}: TextInputFieldWithIconProps) {
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
          className={`p-2  h-[44px] ${mode === "minus" ? "bg-danger-400" : "bg-success-400"} rounded-md  justify-center ${Platform.OS === "web" ? "absolute top-0" : ""}`}
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
            <MyIcon name="Minus" className="text-gray-100" />
          ) : (
            <MyIcon name="Plus" className="text-gray-100" />
          )}
        </Pressable>

        <TextInput
          onLayout={handleLayout}
          className="text-black border rounded-md p-3 border-gray-300 bg-white text-end text-right flex-1"
          value={value?.toString() ?? ""}
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const TextInputFieldWithIcon = memo(TextInputFieldWithIconMemo, areEqual);

export default TextInputFieldWithIcon;
