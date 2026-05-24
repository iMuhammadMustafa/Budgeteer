import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { makeShadow } from "./Shared";

export default function StatCard({
  label,
  value,
  sub,
  delay,
  isUp,
}: {
  label: string;
  value: string;
  sub: string;
  delay: number;
  isUp?: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} className="flex-1 min-w-[100px]">
      <View className="bg-stat-card-bg rounded-2xl p-4 border border-stat-border/[0.08]" style={makeShadow(0.03, 6, 0)}>
        <Text className="text-[11px] text-stat-label/50 mb-[6px] font-medium">{label}</Text>
        <Text className="text-[22px] text-stat-value font-bold tracking-tight mb-[6px]">{value}</Text>
        <Text
          className={`text-[11px] font-semibold ${isUp ? "text-bar-accent" : ""}`}
          style={!isUp ? { color: "#5b9fff" } : undefined}
        >
          {sub}
        </Text>
      </View>
    </Animated.View>
  );
}
