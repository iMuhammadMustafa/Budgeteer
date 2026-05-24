import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function TrustFeature({
  icon,
  text,
  delay,
  isDark,
}: {
  icon: string;
  text: string;
  delay: number;
  isDark?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <View
        className="w-[28px] h-[28px] rounded-[8px] flex-shrink-0 items-center justify-center"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }}
      >
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text className="text-feature-text" style={{ fontSize: 12.5, lineHeight: 18 }}>
        {text}
      </Text>
    </Animated.View>
  );
}
