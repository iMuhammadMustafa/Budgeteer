import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

import GridPattern from "../components/GridPattern";

import { useAuth } from "../providers/AuthProvider";
import { useStorageMode } from "../providers/StorageModeProvider";
import { useTheme } from "../providers/ThemeProvider";
import { StorageMode, StorageModeConfig } from "../types/StorageMode";
import { WATERMELONDB_DEFAULTS, WATERMELONDB_DEMO } from "../types/database/watermelon/constants";

const WEB_DESKTOP_BREAKPOINT = 860;


// Orb gradient colors (can't be expressed via CSS vars since LinearGradient needs string[])
const ORB_COLORS = {
  dark: {
    orb1: ["#3b8a6e44", "transparent"] as const,
    orb2: ["#5b7fff22", "transparent"] as const,
  },
  light: {
    orb1: ["#3b8a6e22", "transparent"] as const,
    orb2: ["#5b7fff14", "transparent"] as const,
  },
};

// ─── Cross-platform shadow helper ────────────────────────────────

function makeShadow(opacity: number, radius: number, offsetY = 4, color = "#000") {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.round(radius / 3),
    ...Platform.select({
      web: {
        boxShadow: `0 ${offsetY}px ${radius * 2}px rgba(0,0,0,${opacity})`,
      },
    }),
  } as any;
}

// ─── Animated floating component ─────────────────────────────────

function FloatingView({
  children,
  amplitude = 11,
  duration = 3000,
  style,
  className,
}: {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  style?: any;
  className?: string;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration }),
        withTiming(amplitude, { duration }),
      ),
      -1,
      true,
    );
  }, [amplitude, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View className={className} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ─── SVG Mini Bar Chart ──────────────────────────────────────────

const BARS_DATA: [number, number][] = [
  [3, 34], [21, 50], [39, 43], [57, 59],
  [75, 47], [93, 55], [111, 67], [129, 56],
];

function MiniBarChart({ primary, accent }: { primary: string; accent: string }) {
  return (
    <Svg width={156} height={78} viewBox="0 0 156 78" fill="none">
      {BARS_DATA.map(([x, h], i) => (
        <Rect
          key={x}
          x={x}
          y={78 - h}
          width={13}
          height={h}
          rx={3.5}
          fill={i === 3 || i === 6 ? accent : primary}
          opacity={0.92}
        />
      ))}
    </Svg>
  );
}

// ─── Shared Components ───────────────────────────────────────────

function HeroIllustration({ scale = 1, barPrimary, barAccent, isDark }: { scale?: number; barPrimary: string; barAccent: string; isDark?: boolean }) {
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
                backgroundColor: Platform.OS === "web" ? undefined : (isDark ? "rgba(32, 32, 38, 0.95)" : "rgba(255, 255, 255, 0.95)"),
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
              <Text className="text-[10.5px] text-hero-label/40 mb-[5px] font-medium">
                Monthly Savings
              </Text>
              <Text className="text-2xl font-bold text-hero-amount tracking-tight mb-[10px]">
                $3,240
              </Text>
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

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel="Toggle theme"
      className="flex-row items-center gap-[7px] bg-toggle-bg/[0.07] border border-toggle-border/[0.12] rounded-[20px] py-[5px] pl-2 pr-[10px]"
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

function ModeCard({
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
      <Pressable
        testID={testID}
        onPress={onPress}
        className="bg-mode-card-bg/95 border border-mode-card-border/[0.08] rounded-[18px] py-[18px] px-5 flex-row items-center gap-4"
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          ...makeShadow(isDark ? 0.15 : 0.04, 8, 4),
        })}
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
          <Text className="font-semibold text-[15px] text-mode-title tracking-tight mb-1">
            {label}
          </Text>
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
      </Pressable>
    </Animated.View>
  );
}

function TrustFeature({ icon, text, delay, isDark }: { icon: string; text: string; delay: number; isDark?: boolean }) {
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
      <Text
        className="text-feature-text"
        style={{ fontSize: 12.5, lineHeight: 18 }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

function StatCard({ label, value, sub, delay, isUp }: { label: string; value: string; sub: string; delay: number; isUp?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} className="flex-1 min-w-[100px]">
      <View
        className="bg-stat-card-bg rounded-2xl p-4 border border-stat-border/[0.08]"
        style={makeShadow(0.03, 6, 0)}
      >
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

// ─── Main Component ──────────────────────────────────────────────

export default function Index() {
  const { storageMode, setStorageMode, isLoading: isStorageLoading } = useStorageMode();
  const { session, setSession, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();

  const isDesktop = width >= WEB_DESKTOP_BREAKPOINT;
  const isLoading = isStorageLoading || isAuthLoading;
  const isDark = theme === "dark";
  const orbs = isDark ? ORB_COLORS.dark : ORB_COLORS.light;

  // Resolve bar colors from CSS vars for SVG (SVG fill needs actual color strings)
  const barPrimary = isDark ? "#3b8a6e" : "#3b8a6e";
  const barAccent = isDark ? "#5ddc9a" : "#2cb87a";

  useEffect(() => {
    if (!isLoading && storageMode && session) {
      router.push("/Dashboard");
    }
  }, [isLoading, storageMode, session]);

  const handleLogin = useCallback(
    async (mode: any) => {
      if (storageMode && session) {
        await logout();
      }

      if (mode.id === StorageMode.Cloud) {
        return router.push("/Login");
      }

      const success = await setStorageMode(mode.id);
      if (!success) {
        console.warn("Storage mode initialization failed — staying on landing page.");
        return;
      }

      if (mode.id === StorageMode.Local) {
        await setSession(
          {
            user: {
              id: WATERMELONDB_DEFAULTS.userId, email: WATERMELONDB_DEFAULTS.email,
              user_metadata: { tenantid: WATERMELONDB_DEFAULTS.tenantId, full_name: WATERMELONDB_DEFAULTS.name },
              app_metadata: {}, aud: "authenticated", created_at: new Date().toISOString(),
            },
            access_token: "local-access-token", refresh_token: "local-refresh-token", expires_in: 3600, token_type: "bearer",
          }, StorageMode.Local
        );
      }
      if (mode.id === StorageMode.Demo) {
        await setSession(
          {
            user: {
              id: WATERMELONDB_DEMO.userId, email: WATERMELONDB_DEMO.email,
              user_metadata: { tenantid: WATERMELONDB_DEMO.tenantId, full_name: WATERMELONDB_DEMO.name },
              app_metadata: {}, aud: "authenticated", created_at: new Date().toISOString(),
            },
            access_token: "demo-access-token", refresh_token: "demo-refresh-token", expires_in: 3600, token_type: "bearer",
          }, StorageMode.Demo
        );
      }
      console.log("Navigating to Dashboard");
      return router.push("/Dashboard");
    },
    [session, setSession, storageMode, setStorageMode, logout],
  );

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
              <LinearGradient colors={[...orbs.orb1]} style={{ width: 600, height: 600, borderRadius: 300 }} />
            </FloatingView>
            <FloatingView amplitude={12} duration={6000} className="absolute" style={{ bottom: "-10%", right: "-10%" }}>
              <LinearGradient colors={[...orbs.orb2]} style={{ width: 500, height: 500, borderRadius: 250 }} />
            </FloatingView>
          </View>

          <View className="max-w-[540px] z-10 mt-10 px-10">
            <Animated.Text entering={FadeInDown.delay(100)} className="text-accent-green font-bold text-xs tracking-widest mb-4">
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
                >your money</Text>
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
              <Text className="text-[15px] text-subtext/50">Choose how you'd like to use Budgeteer</Text>
            </Animated.View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)", marginBottom: 28 }} />

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
            <View style={{ height: 1, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)", marginTop: 28, marginBottom: 28 }} />

            <View style={{ gap: 13 }}>
              <TrustFeature icon="🔒" text="Bank-grade encryption keeps your data safe" delay={800} isDark={isDark} />
              <TrustFeature icon="📊" text="Smart insights and weekly spending reports" delay={900} isDark={isDark} />
              <TrustFeature icon="🎯" text="Set goals and get nudged when you're off track" delay={1000} isDark={isDark} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MOBILE / NATIVE LAYOUT (Single Column)
  // ─────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-page-bg">
      {/* Background layer */}
      <View className="absolute inset-0 overflow-hidden">
        <FloatingView amplitude={14} duration={4500} className="absolute" style={{ top: -80, left: -60, width: 320, height: 320, borderRadius: 160 }}>
          <LinearGradient colors={[...orbs.orb1]} style={{ width: "100%", height: "100%", borderRadius: 160 }} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
        </FloatingView>
        <FloatingView amplitude={12} duration={5500} className="absolute" style={{ bottom: 60, right: -80, width: 280, height: 280, borderRadius: 140 }}>
          <LinearGradient colors={[...orbs.orb2]} style={{ width: "100%", height: "100%", borderRadius: 140 }} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
        </FloatingView>

      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, paddingVertical: 60 }}>
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
              Choose how you'd like to get started
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
            <Text className="text-center text-[13px] text-feature-text">
              You can switch modes any time in Settings
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
