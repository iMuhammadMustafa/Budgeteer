import { LinearGradient } from "expo-linear-gradient";
import { Platform, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import GridPattern from "@/src/components/GridPattern";
import FloatingView from "@/src/components/LandingPage/FloatingView";
import HeroIllustration from "@/src/components/LandingPage/Hero";
import ModeCard from "@/src/components/LandingPage/ModeCard";
import StatCard from "@/src/components/LandingPage/StatCard";
import ThemeToggle from "@/src/components/LandingPage/ThemeSwitcher";
import TrustFeature from "@/src/components/LandingPage/TrustFeature";
import useLandingPage from "@/src/components/LandingPage/useLandingPage";
import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";

export default function Index() {
  const { isLoading, isDesktop, isDark, orbs, barPrimary, barAccent, handleLogin, toggleTheme } = useLandingPage();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-page-bg">
        <Text className="text-subtext/50 text-base">Loading...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DESKTOP SPLIT LAYOUT
  // ─────────────────────────────────────────────────────────────
  if (isDesktop && Platform.OS === "web") {
    return (
      <WebSplit
        isDark={isDark}
        toggleTheme={toggleTheme}
        handleLogin={handleLogin}
        barPrimary={barPrimary}
        barAccent={barAccent}
        orbs={orbs}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MOBILE / NATIVE LAYOUT (Single Column)
  // ─────────────────────────────────────────────────────────────
  return (
    <MobileView
      isDark={isDark}
      toggleTheme={toggleTheme}
      handleLogin={handleLogin}
      barPrimary={barPrimary}
      barAccent={barAccent}
      orbs={orbs}
    />
  );
}

function WebSplit({
  isDark,
  toggleTheme,
  handleLogin,
  barPrimary,
  barAccent,
  orbs,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  handleLogin: (mode: typeof StorageModeConfig[StorageMode]) => void;
  barPrimary: string;
  barAccent: string;
  orbs: {
    orb1: readonly [string, string, ...string[]];
    orb2: readonly [string, string, ...string[]];
  };
}) {
  return (
    <View className="flex-1 flex-row bg-page-bg">
      {/* Fixed Navbar Desktop */}
      <View
        className="absolute top-0 left-0 right-0 h-[60px] flex-row justify-between items-center px-10 z-50"
        style={Platform.select({
          web: {
            borderBottomWidth: 1,
            borderBottomStyle: "solid" as any,
            borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
            backdropFilter: "blur(20px)",
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
          },
        })}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-lg bg-[#10b981] items-center justify-center">
            <Text className="text-white font-bold text-base">B</Text>
          </View>
          <Text className="font-bold text-xl text-heading tracking-tight">Budgeteer</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <Text className="text-subtext/50 text-[13px] font-medium">v2.0</Text>
          <ThemeToggle dark={isDark} onToggle={toggleTheme} />
        </View>
      </View>

      {/* LEFT PANEL: BRAND STORY */}
      <View className="bg-panel-bg relative overflow-hidden justify-center items-center" style={{ flex: 52 }}>
        <View className="absolute inset-0 opacity-60">
          <GridPattern />
          <FloatingView amplitude={15} duration={5000} className="absolute" style={{ top: "10%", left: "-10%" }}>
            <LinearGradient colors={orbs.orb1} style={{ width: 600, height: 600, borderRadius: 300 }} />
          </FloatingView>
          <FloatingView amplitude={12} duration={6000} className="absolute" style={{ bottom: "-10%", right: "-10%" }}>
            <LinearGradient colors={orbs.orb2} style={{ width: 500, height: 500, borderRadius: 250 }} />
          </FloatingView>
        </View>

        <View className="max-w-[540px] z-10 mt-10 px-10">
          <Animated.Text
            entering={FadeInDown.delay(100)}
            className="text-accent-green font-bold text-xs tracking-widest mb-4"
          >
            PERSONAL FINANCE, SIMPLIFIED
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text className="font-extrabold text-heading tracking-tighter leading-[56px]" style={{ fontSize: 52 }}>
              Take control of{"\n"}
              <Text
                className="text-heading-grad-start"
                style={Platform.select({
                  web: {
                    backgroundImage: `linear-gradient(100deg, rgb(var(--color-heading-grad-start)), rgb(var(--color-heading-grad-end)))`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  } as any,
                })}
              >
                your money
              </Text>
            </Text>
            <Text className="text-lg text-subtext/50 leading-7 mt-5 max-w-[440px]">
              Track spending, grow savings, and reach your goals — all in one beautiful app.
            </Text>
          </Animated.View>

          <View className="flex-row gap-4 mt-10 mb-[50px]">
            <StatCard label="Avg. Saved" value="$3.2k" sub="↑ per month" delay={300} isUp />
            <StatCard label="Categories" value="12+" sub="tracked auto" delay={400} />
            <StatCard label="Platforms" value="3+" sub="iOS · Android · Web" delay={500} />
          </View>

          <View className="pl-5">
            <HeroIllustration scale={1.25} barPrimary={barPrimary} barAccent={barAccent} isDark={isDark} />
          </View>
        </View>
      </View>

      {/* RIGHT PANEL: ACTIONS */}
      <View className="justify-center items-center py-10 px-10" style={{ flex: 48 }}>
        <View className="w-full max-w-[420px]">
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="font-bold text-[28px] text-heading tracking-tight mb-[10px]">Welcome back 👋</Text>
            <Text className="text-[15px] text-subtext/50">Choose how you&apos;d like to use Budgeteer</Text>
          </Animated.View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
              marginBottom: 28,
            }}
          />

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
                enterDelay={300 + i * 100}
              />
            ))}
          </View>

          <Animated.Text entering={FadeInDown.delay(700)} className="text-[13px] text-feature-text mt-[22px]">
            You can switch modes any time in Settings
          </Animated.Text>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
              marginTop: 28,
              marginBottom: 28,
            }}
          />

          <View style={{ gap: 13 }}>
            <TrustFeature icon="🔒" text="Bank-grade encryption keeps your data safe" delay={800} isDark={isDark} />
            <TrustFeature icon="📊" text="Smart insights and weekly spending reports" delay={900} isDark={isDark} />
            <TrustFeature
              icon="🎯"
              text="Set goals and get nudged when you're off track"
              delay={1000}
              isDark={isDark}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function MobileView({
  isDark,
  toggleTheme,
  handleLogin,
  barPrimary,
  barAccent,
  orbs,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  handleLogin: (mode: typeof StorageModeConfig[StorageMode]) => void;
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
            <Text className="text-center text-[13px] text-feature-text">You can switch modes any time in Settings</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
