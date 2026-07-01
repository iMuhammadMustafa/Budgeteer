import { Pressable, Text, View } from "react-native";
import { makeShadow } from "./Shared";

export default function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
      className="flex-row items-center gap-[7px] bg-toggle-bg/[0.07] border border-toggle-border/[0.12] rounded-[20px] py-[5px] pl-2 pr-[10px] active:opacity-70"
      testID="btn-theme-toggle"
    >
      <Text className="text-[13px] leading-[18px]">{dark ? "🌙" : "☀️"}</Text>
      <View style={{ width: 36, height: 20, borderRadius: 10, position: "relative" }} className="bg-toggle-track">
        <View
          style={{
            position: "absolute",
            top: 3,
            left: dark ? 17 : 3,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: dark ? "#5ddc9a" : "#ffffff",
            ...makeShadow(0.25, 5, 1),
          }}
        />
      </View>
      <Text className="text-[11px] font-medium text-toggle-label/50">{dark ? "Dark" : "Light"}</Text>
    </Pressable>
  );
}
