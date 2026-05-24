import { Platform, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import FloatingView from "./FloatingView";
import MiniBarChart from "./MiniBarChart";
import { makeShadow } from "./Shared";

export default function HeroIllustration({
  scale = 1,
  barPrimary,
  barAccent,
  isDark,
}: {
  scale?: number;
  barPrimary: string;
  barAccent: string;
  isDark?: boolean;
}) {
  return (
    <View style={{ width: 250 * scale, height: 250 * scale, position: "relative", overflow: "visible" }}>
      <View style={{ width: 250, height: 250, transform: [{ scale }], transformOrigin: "top left" }}>
        {/* Badge – top left */}
        <FloatingView amplitude={6} duration={4000} style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View
              className="bg-badge-bg/15 border border-badge-border/30 rounded-[10px] py-[5px] px-[9px]"
              style={{ alignSelf: "flex-start" }}
            >
              <Text className="text-[10.5px] text-badge-text font-semibold">✓ On track</Text>
            </View>
          </Animated.View>
        </FloatingView>

        {/* Chart card – center */}
        <FloatingView amplitude={11} duration={3000} style={{ position: "absolute", top: 32, left: 20, zIndex: 1 }}>
          <Animated.View entering={FadeInDown.delay(0).duration(500)}>
            <View
              className="rounded-[22px] p-[18px] pb-[15px]"
              style={{
                alignSelf: "flex-start",
                backgroundColor:
                  Platform.OS === "web" ? undefined : isDark ? "rgba(32, 32, 38, 0.95)" : "rgba(255, 255, 255, 0.95)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.07)",
                ...makeShadow(isDark ? 0.3 : 0.1, 16, 12),
                ...Platform.select({
                  web: {
                    backdropFilter: "blur(18px)",
                    backgroundColor: "rgb(var(--color-hero-card) / 0.9)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: isDark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.07)",
                    boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.1)",
                  },
                }),
              }}
            >
              <Text className="text-[10.5px] text-hero-label/40 mb-[5px] font-medium">Monthly Savings</Text>
              <Text className="text-2xl font-bold text-hero-amount tracking-tight mb-[10px]">$3,240</Text>
              <MiniBarChart primary={barPrimary} accent={barAccent} />
            </View>
          </Animated.View>
        </FloatingView>

        {/* Pill – top right */}
        <FloatingView amplitude={9} duration={3500} style={{ position: "absolute", top: 6, left: 160, zIndex: 2 }}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View
              className="bg-float-card/90 border border-float-card-border/10 rounded-[13px] py-[7px] px-[11px]"
              style={{
                alignSelf: "flex-start",
                ...makeShadow(0.1, 6, 4),
                ...Platform.select({
                  web: { backdropFilter: "blur(12px)" },
                }),
              }}
            >
              <Text className="text-[11px] text-float-text/85 font-medium">↑ 12% vs last month</Text>
            </View>
          </Animated.View>
        </FloatingView>

        {/* Pill – bottom left */}
        <FloatingView amplitude={6} duration={2500} style={{ position: "absolute", top: 180, left: 0, zIndex: 2 }}>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View
              className="bg-float-card/90 border border-float-card-border/10 rounded-[13px] py-[7px] px-[11px]"
              style={{
                alignSelf: "flex-start",
                ...makeShadow(0.1, 6, 4),
                ...Platform.select({
                  web: { backdropFilter: "blur(12px)" },
                }),
              }}
            >
              <Text className="text-[11px] text-float-text/85 font-medium">🏠 Rent · $1,500</Text>
            </View>
          </Animated.View>
        </FloatingView>
      </View>
    </View>
  );
}
