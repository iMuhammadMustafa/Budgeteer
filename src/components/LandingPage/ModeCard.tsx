import { Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import Button from "../elements/Button";

export default function ModeCard({
  icon,
  label,
  desc,
  accent,
  onPress,
  isDark,
  testID,
  enterDelay,
}: {
  icon: string;
  label: string;
  desc: string;
  accent: string;
  onPress: () => void;
  isDark: boolean;
  testID?: string;
  enterDelay: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(enterDelay).duration(480).springify()}>
      <Button
        variant="ghost"
        size="lg"
        hapticFeedback="light"
        testID={testID}
        onPress={onPress}
        className="bg-mode-card-bg/95 border border-mode-card-border/[0.08] rounded-[18px] py-[18px] px-5 flex-row items-center gap-4"
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: accent + "1c",
            borderWidth: 1.5,
            borderColor: accent + "48",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-[22px]">{icon}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="font-semibold text-[15px] text-mode-title tracking-tight mb-1">{label}</Text>
          <Text className="text-[13px] text-mode-desc/50 leading-[18px]">{desc}</Text>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: accent + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: accent, fontWeight: "700" }}>›</Text>
        </View>
      </Button>
    </Animated.View>
  );
}
