import { LinearGradient } from "expo-linear-gradient";
import { Platform, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import FloatingView from "@/src/components/LandingPage/FloatingView";
import HeroIllustration from "@/src/components/LandingPage/Hero";
import ModeCard from "@/src/components/LandingPage/ModeCard";
import ThemeToggle from "@/src/components/LandingPage/ThemeSwitcher";
import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";

export default function MobileView({
  isDark,
  toggleTheme,
  handleLogin,
  barPrimary,
  barAccent,
  orbs,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  handleLogin: (mode: (typeof StorageModeConfig)[StorageMode]) => void;
  barPrimary: string;
  barAccent: string;
  orbs: {
    orb1: readonly [string, string, ...string[]];
    orb2: readonly [string, string, ...string[]];
  };
}) {
  return (
    <View className="flex-1 bg-page-bg">
      {/* Background layer */}
      <View className="absolute inset-0 overflow-hidden">
        <FloatingView
          amplitude={14}
          duration={4500}
          className="absolute"
          style={{ top: -80, left: -60, width: 320, height: 320, borderRadius: 160 }}
        >
          <LinearGradient
            colors={orbs.orb1}
            style={{ width: "100%", height: "100%", borderRadius: 160 }}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </FloatingView>
        <FloatingView
          amplitude={12}
          duration={5500}
          className="absolute"
          style={{ bottom: 60, right: -80, width: 280, height: 280, borderRadius: 140 }}
        >
          <LinearGradient
            colors={orbs.orb2}
            style={{ width: "100%", height: "100%", borderRadius: 140 }}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </FloatingView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          paddingVertical: 60,
        }}
      >
        <View className="w-full max-w-[400px] items-center">
          {/* Status bar row */}
          <View className="w-full flex-row justify-end items-center mb-8">
            <ThemeToggle dark={isDark} onToggle={toggleTheme} />
          </View>

          {/* Hero section */}
          <View className="w-full h-[250px] items-center mb-4">
            <HeroIllustration scale={1} barPrimary={barPrimary} barAccent={barAccent} isDark={isDark} />
          </View>

          {/* Welcome heading */}
          <Animated.View entering={FadeInDown.delay(350).duration(480)} className="items-center mb-8">
            <Text className="font-bold text-[27px] text-heading tracking-tight leading-[31px] text-center mb-2">
              Welcome to
            </Text>
            <Text
              className="font-bold text-[28px] tracking-tight leading-[34px] text-center text-heading-grad-start"
              style={Platform.select({
                web: {
                  backgroundImage: `linear-gradient(90deg, rgb(var(--color-heading-grad-start)), rgb(var(--color-heading-grad-end)))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                },
              })}
            >
              Budgeteer
            </Text>
            <Text className="text-sm text-subtext/50 leading-[21px] max-w-[260px] text-center mt-3">
              Choose how you&apos;d like to get started
            </Text>
          </Animated.View>

          {/* Mode cards */}
          <View className="w-full gap-3">
            {Object.values(StorageModeConfig).map((mode, i) => (
              <ModeCard
                key={mode.id}
                testID={`mode-${mode.id}`}
                icon={mode.icon}
                label={mode.title}
                desc={mode.description}
                accent={mode.accent!}
                onPress={() => handleLogin(mode)}
                isDark={isDark}
                enterDelay={450 + i * 120}
              />
            ))}
          </View>

          {/* Hint */}
          <Animated.View entering={FadeInDown.delay(850).duration(480)} className="mt-6">
            <Text className="text-center text-[10px] text-feature-text">You can switch modes any time in Settings</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
