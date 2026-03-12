import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

import { useAuth } from "../providers/AuthProvider";
import { useStorageMode } from "../providers/StorageModeProvider";
import { useTheme } from "../providers/ThemeProvider";
import { StorageMode, StorageModeConfig } from "../types/StorageMode";
import { WATERMELONDB_DEFAULTS, WATERMELONDB_DEMO } from "../types/database/watermelon/constants";

// ─── Theme palettes ──────────────────────────────────────────────

const DARK = {
  pageBg: "#111113",
  panelBg: "#0e0e12", // Left panel on desktop
  orb1: ["#3b8a6e44", "transparent"] as const,
  orb2: ["#5b7fff22", "transparent"] as const,
  grid: "rgba(255,255,255,0.025)",
  heroCard: "rgba(23,23,25,0.85)", // Solid dark base instead of pure transparent for native
  heroCardBorder: "rgba(255,255,255,0.1)",
  floatCard: "rgba(28,28,32,0.9)", // Solid dark base for pills
  floatCardBorder: "rgba(255,255,255,0.1)",
  floatText: "rgba(255,255,255,0.85)",
  heroLabel: "rgba(255,255,255,0.4)",
  heroAmount: "#f0ede8",
  barPrimary: "#3b8a6e",
  barAccent: "#5ddc9a",
  badgeBg: "rgba(93,220,154,0.15)",
  badgeBorder: "rgba(93,220,154,0.3)",
  badgeText: "#5ddc9a",
  heading: "#f0ede8",
  headingGrad: ["#5ddc9a", "#3bbfa0"] as const,
  subtext: "rgba(255,255,255,0.45)",
  modeCardBg: "rgba(30,30,35,0.95)", // Solid dark base for cards
  modeCardBorder: "rgba(255,255,255,0.08)",
  modeTitle: "#f0ede8",
  modeDesc: "rgba(255,255,255,0.45)",
  hint: "rgba(255,255,255,0.3)",
  toggleTrack: "#2a6e53",
  toggleKnob: "#5ddc9a",
  toggleLabel: "rgba(255,255,255,0.45)",
  toggleBg: "rgba(255,255,255,0.07)",
  toggleBorder: "rgba(255,255,255,0.12)",
  trustIcon: "rgba(255,255,255,0.08)",
  trustText: "rgba(255,255,255,0.45)",
  statCardBg: "rgba(30,30,35,0.95)",
  statBorder: "rgba(255,255,255,0.08)",
  statLabel: "rgba(255,255,255,0.45)",
  statValue: "#f0ede8",
};

const LIGHT = {
  pageBg: "#faf9f6",
  panelBg: "#f2f0ea", // Left panel on desktop
  orb1: ["#3b8a6e22", "transparent"] as const,
  orb2: ["#5b7fff14", "transparent"] as const,
  grid: "rgba(0,0,0,0.04)",
  heroCard: "rgba(255,255,255,0.95)", // More opaque for native
  heroCardBorder: "rgba(0,0,0,0.06)",
  floatCard: "rgba(255,255,255,0.95)", // More opaque for pills
  floatCardBorder: "rgba(0,0,0,0.08)",
  floatText: "rgba(0,0,0,0.7)",
  heroLabel: "rgba(0,0,0,0.4)",
  heroAmount: "#18181b",
  barPrimary: "#3b8a6e",
  barAccent: "#2cb87a",
  badgeBg: "rgba(44,184,122,0.12)",
  badgeBorder: "rgba(44,184,122,0.35)",
  badgeText: "#1a9e62",
  heading: "#18181b",
  headingGrad: ["#1a9e62", "#2880b0"] as const,
  subtext: "rgba(0,0,0,0.5)",
  modeCardBg: "rgba(255,255,255,1)", // Solid white for cards
  modeCardBorder: "rgba(0,0,0,0.06)",
  modeTitle: "#18181b",
  modeDesc: "rgba(0,0,0,0.5)",
  hint: "rgba(0,0,0,0.35)",
  toggleTrack: "#d1ead9",
  toggleKnob: "#ffffff",
  toggleLabel: "rgba(0,0,0,0.5)",
  toggleBg: "rgba(0,0,0,0.04)",
  toggleBorder: "rgba(0,0,0,0.08)",
  trustIcon: "rgba(0,0,0,0.04)",
  trustText: "rgba(0,0,0,0.5)",
  statCardBg: "rgba(255,255,255,1)",
  statBorder: "rgba(0,0,0,0.06)",
  statLabel: "rgba(0,0,0,0.45)",
  statValue: "#18181b",
};

type ThemePalette = typeof DARK;

const WEB_DESKTOP_BREAKPOINT = 860;

// Update descriptions for the new design
const UPDATED_MODE_DESCS = {
  [StorageMode.Cloud]: "Sync seamlessly across all your devices with end-to-end encryption",
  [StorageMode.Demo]: "Explore every feature with realistic pre-filled sample data",
  [StorageMode.Local]: "Everything stays private on this device — no account needed",
};

// ─── Animated floating component ─────────────────────────────────

function FloatingView({
  children,
  amplitude = 11,
  duration = 3000,
  style,
}: {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  style?: any;
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

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

// ─── SVG Mini Bar Chart ──────────────────────────────────────────

const BARS_DATA: [number, number][] = [
  [3, 34],
  [21, 50],
  [39, 43],
  [57, 59],
  [75, 47],
  [93, 55],
  [111, 67],
  [129, 56],
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

function HeroIllustration({ t, scale = 1 }: { t: ThemePalette; scale?: number }) {
  return (
    <View style={{ width: 250 * scale, height: 250 * scale, position: "relative" }}>
      <View style={{ transform: [{ scale }], transformOrigin: "top left" }}>
        {/* Badge – top left */}
        <FloatingView amplitude={6} duration={4000} style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}>
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <View
              style={{
                backgroundColor: t.badgeBg,
                borderWidth: 1,
                borderColor: t.badgeBorder,
                borderRadius: 10,
                paddingVertical: 5,
                paddingHorizontal: 9,
              }}
            >
              <Text style={{ fontSize: 10.5, color: t.badgeText, fontWeight: "600" }}>✓ On track</Text>
            </View>
          </Animated.View>
        </FloatingView>

        {/* Chart card – center */}
        <FloatingView amplitude={11} duration={3000} style={{ position: "absolute", top: 32, left: 20, zIndex: 1 }}>
          <Animated.View entering={FadeInDown.delay(0).duration(500)}>
            <View
              style={{
                backgroundColor: t.heroCard,
                borderWidth: 1,
                borderColor: t.heroCardBorder,
                borderRadius: 22,
                padding: 18,
                paddingBottom: 15,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 32,
                elevation: 10,
                ...Platform.select({
                  web: { boxShadow: `0 20px 60px rgba(0,0,0,${t === DARK ? 0.4 : 0.08})`, backdropFilter: "blur(16px)" },
                }),
              }}
            >
              <Text style={{ fontSize: 10.5, color: t.heroLabel, marginBottom: 5, fontWeight: "500" }}>
                Monthly Savings
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: t.heroAmount,
                  letterSpacing: -0.8,
                  marginBottom: 10,
                }}
              >
                $3,240
              </Text>
              <MiniBarChart primary={t.barPrimary} accent={t.barAccent} />
            </View>
          </Animated.View>
        </FloatingView>

        {/* Pill – top right */}
        <FloatingView amplitude={9} duration={3500} style={{ position: "absolute", top: 6, left: 160, zIndex: 2 }}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
             <View
              style={{
                backgroundColor: t.floatCard,
                borderWidth: 1,
                borderColor: t.floatCardBorder,
                borderRadius: 13,
                paddingVertical: 7,
                paddingHorizontal: 11,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
                ...Platform.select({
                  web: { backdropFilter: "blur(12px)" },
                }),
              }}
            >
              <Text style={{ fontSize: 11, color: t.floatText, fontWeight: "500" }}>↑ 12% vs last month</Text>
            </View>
          </Animated.View>
        </FloatingView>

        {/* Pill – bottom left */}
        <FloatingView amplitude={6} duration={2500} style={{ position: "absolute", top: 180, left: 0, zIndex: 2 }}>
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View
              style={{
                backgroundColor: t.floatCard,
                borderWidth: 1,
                borderColor: t.floatCardBorder,
                borderRadius: 13,
                paddingVertical: 7,
                paddingHorizontal: 11,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
                ...Platform.select({
                  web: { backdropFilter: "blur(12px)" },
                }),
              }}
            >
              <Text style={{ fontSize: 11, color: t.floatText, fontWeight: "500" }}>🏠 Rent · $1,500</Text>
            </View>
          </Animated.View>
        </FloatingView>
      </View>
    </View>
  );
}

function ThemeToggle({ dark, onToggle, t }: { dark: boolean; onToggle: () => void; t: ThemePalette }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityLabel="Toggle theme"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: t.toggleBg,
        borderWidth: 1,
        borderColor: t.toggleBorder,
        borderRadius: 20,
        paddingVertical: 5,
        paddingLeft: 8,
        paddingRight: 10,
      }}
    >
      <Text style={{ fontSize: 13, lineHeight: 18 }}>{dark ? "🌙" : "☀️"}</Text>
      <View
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          backgroundColor: t.toggleTrack,
          position: "relative",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 3,
            left: dark ? 17 : 3,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: t.toggleKnob,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 3,
            ...Platform.select({
              web: { boxShadow: "0 1px 5px rgba(0,0,0,0.25)" },
            }),
          }}
        />
      </View>
      <Text style={{ fontSize: 11, fontWeight: "500", color: t.toggleLabel }}>{dark ? "Dark" : "Light"}</Text>
    </Pressable>
  );
}

function ModeCard({
  icon,
  label,
  desc,
  accent,
  onPress,
  t,
  testID,
  enterDelay,
}: {
  icon: string;
  label: string;
  desc: string;
  accent: string;
  onPress: () => void;
  t: ThemePalette;
  testID?: string;
  enterDelay: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(enterDelay).duration(480).springify()}>
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: t.modeCardBg, // Explicit background block
          borderWidth: 1,
          borderColor: t.modeCardBorder,
          borderRadius: 18,
          paddingVertical: 18,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: t === DARK ? 0.15 : 0.04,
          shadowRadius: 16,
          elevation: 3,
          ...Platform.select({
            web: { boxShadow: `0 4px 24px rgba(0,0,0,${t === DARK ? 0.2 : 0.05})` },
          }),
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
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontWeight: "600", fontSize: 15, color: t.modeTitle, letterSpacing: -0.3, marginBottom: 4 }}>
            {label}
          </Text>
          <Text style={{ fontSize: 13, color: t.modeDesc, lineHeight: 18 }}>{desc}</Text>
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

function TrustFeature({ icon, text, t, delay }: { icon: string; text: string; t: ThemePalette; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.trustIcon, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 13, color: t.trustText, fontWeight: "500" }}>{text}</Text>
    </Animated.View>
  );
}

function StatCard({ label, value, sub, delay, t, isUp }: { label: string; value: string; sub: string; delay: number; t: ThemePalette; isUp?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={{ flex: 1, minWidth: 100 }}>
      <View style={{ backgroundColor: t.statCardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.statBorder, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 12, elevation: 1 }}>
        <Text style={{ fontSize: 11, color: t.statLabel, marginBottom: 6, fontWeight: "500" }}>{label}</Text>
        <Text style={{ fontSize: 22, color: t.statValue, fontWeight: "700", letterSpacing: -0.5, marginBottom: 6 }}>{value}</Text>
        <Text style={{ fontSize: 11, color: isUp ? t.barAccent : "#5b9fff", fontWeight: "600" }}>{sub}</Text>
      </View>
    </Animated.View>
  );
}

function GridPattern({ color }: { color: string }) {
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          // @ts-expect-error web-only
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    );
  }
  return null;
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
  const t = isDark ? DARK : LIGHT;

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

      await setStorageMode(mode.id);
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.pageBg }}>
        <Text style={{ color: t.subtext, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DESKTOP SPLIT LAYOUT
  // ─────────────────────────────────────────────────────────────
  if (isDesktop && Platform.OS === "web") {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: t.pageBg }}>
        {/* Fixed Navbar Desktop */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 40, zIndex: 50 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>B</Text>
            </View>
            <Text style={{ fontWeight: "700", fontSize: 20, color: t.heading, letterSpacing: -0.5 }}>Budgeteer</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Text style={{ color: t.subtext, fontSize: 13, fontWeight: "500" }}>v2.0</Text>
            <ThemeToggle dark={isDark} onToggle={toggleTheme} t={t} />
          </View>
        </View>

        {/* LEFT PANEL: BRAND STORY */}
        <View style={{ flex: 52, backgroundColor: t.panelBg, position: "relative", overflow: "hidden", justifyContent: "center", paddingLeft: 60, paddingRight: 40 }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }}>
             <GridPattern color={t.grid} />
             <FloatingView amplitude={15} duration={5000} style={{ position: "absolute", top: "10%", left: "-10%" }}>
                <LinearGradient colors={[...t.orb1]} style={{ width: 600, height: 600, borderRadius: 300 }} />
             </FloatingView>
             <FloatingView amplitude={12} duration={6000} style={{ position: "absolute", bottom: "-10%", right: "-10%" }}>
                <LinearGradient colors={[...t.orb2]} style={{ width: 500, height: 500, borderRadius: 250 }} />
             </FloatingView>
          </View>

          <View style={{ maxWidth: 540, zIndex: 10, marginTop: 40 }}>
            <Animated.Text entering={FadeInDown.delay(100)} style={{ color: t.barPrimary, fontWeight: "700", fontSize: 12, letterSpacing: 1.5, marginBottom: 16 }}>
              PERSONAL FINANCE, SIMPLIFIED
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text style={{ fontWeight: "800", fontSize: 52, color: t.heading, letterSpacing: -1.5, lineHeight: 56 }}>
                Take control of{"\n"}
                <Text style={{ color: t.headingGrad[1] }}>your money</Text>
              </Text>
              <Text style={{ fontSize: 18, color: t.subtext, lineHeight: 28, marginTop: 20, maxWidth: 440 }}>
                Track spending, grow savings, and reach your goals — all in one beautiful app.
              </Text>
            </Animated.View>

            <View style={{ flexDirection: "row", gap: 16, marginTop: 40, marginBottom: 50 }}>
              <StatCard label="Avg. Saved" value="$3.2k" sub="↑ per month" delay={300} isUp t={t} />
              <StatCard label="Categories" value="12+" sub="tracked auto" delay={400} t={t} />
              <StatCard label="Users" value="50k" sub="and growing" delay={500} t={t} />
            </View>

            <View style={{ paddingLeft: 20 }}>
              <HeroIllustration t={t} scale={1.25} />
            </View>
          </View>
        </View>

        {/* RIGHT PANEL: ACTIONS */}
        <View style={{ flex: 48, justifyContent: "center", alignItems: "center", paddingVertical: 40, paddingHorizontal: 40 }}>
          <View style={{ width: "100%", maxWidth: 460 }}>
            <Animated.View entering={FadeInDown.delay(200)} style={{ marginBottom: 32 }}>
              <Text style={{ fontWeight: "700", fontSize: 32, color: t.heading, letterSpacing: -0.5, marginBottom: 8 }}>Welcome back 👋</Text>
              <Text style={{ fontSize: 15, color: t.subtext }}>Choose how you'd like to use Budgeteer</Text>
            </Animated.View>

            <View style={{ width: "100%", gap: 12, marginBottom: 32 }}>
              {Object.values(StorageModeConfig).map((mode, i) => (
                <ModeCard
                  key={mode.id}
                  testID={`mode-${mode.id}`}
                  icon={mode.icon}
                  label={mode.title}
                  desc={UPDATED_MODE_DESCS[mode.id as StorageMode] || mode.description}
                  accent={mode.accent!}
                  onPress={() => handleLogin(mode)}
                  t={t}
                  enterDelay={300 + i * 100}
                />
              ))}
            </View>

            <Animated.Text entering={FadeInDown.delay(700)} style={{ fontSize: 13, color: t.hint, textAlign: "center", marginBottom: 40 }}>
              You can switch modes any time in Settings
            </Animated.Text>

            <View style={{ paddingHorizontal: 10 }}>
               <TrustFeature icon="🔒" text="Bank-grade encryption keeps your data safe" t={t} delay={800} />
               <TrustFeature icon="📊" text="Smart insights and weekly spending reports" t={t} delay={900} />
               <TrustFeature icon="🎯" text="Set goals and get nudged when you're off track" t={t} delay={1000} />
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
    <View style={{ flex: 1, backgroundColor: t.pageBg }}>
      {/* Background layer */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <FloatingView amplitude={14} duration={4500} style={{ position: "absolute", top: -80, left: -60, width: 320, height: 320, borderRadius: 160 }}>
          <LinearGradient colors={[...t.orb1]} style={{ width: "100%", height: "100%", borderRadius: 160 }} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
        </FloatingView>
        <FloatingView amplitude={12} duration={5500} style={{ position: "absolute", bottom: 60, right: -80, width: 280, height: 280, borderRadius: 140 }}>
          <LinearGradient colors={[...t.orb2]} style={{ width: "100%", height: "100%", borderRadius: 140 }} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
        </FloatingView>
        <GridPattern color={t.grid} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24, paddingVertical: 60 }}>
        <View style={{ width: "100%", maxWidth: 400, alignItems: "center" }}>
          {/* Status bar row */}
          <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 32 }}>
            <ThemeToggle dark={isDark} onToggle={toggleTheme} t={t} />
          </View>

          {/* Hero section */}
          <View style={{ width: "100%", height: 250, alignItems: "center", marginBottom: 16 }}>
             <HeroIllustration t={t} scale={1} />
          </View>

          {/* Welcome heading */}
          <Animated.View entering={FadeInDown.delay(350).duration(480)} style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontWeight: "700", fontSize: 27, color: t.heading, letterSpacing: -1, lineHeight: 31, textAlign: "center", marginBottom: 8 }}>
              Welcome to
            </Text>
            <Text
              style={{
                fontWeight: "700", fontSize: 28, letterSpacing: -1, lineHeight: 34, textAlign: "center", color: t.headingGrad[0],
                ...Platform.select({
                  web: {
                    // @ts-expect-error
                    backgroundImage: `linear-gradient(90deg, ${t.headingGrad[0]}, ${t.headingGrad[1]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  },
                }),
              }}
            >
              Budgeteer
            </Text>
            <Text style={{ fontSize: 14, color: t.subtext, lineHeight: 21, maxWidth: 260, textAlign: "center", marginTop: 12 }}>
              Choose how you'd like to get started
            </Text>
          </Animated.View>

          {/* Mode cards */}
          <View style={{ width: "100%", gap: 12 }}>
            {Object.values(StorageModeConfig).map((mode, i) => (
              <ModeCard
                key={mode.id}
                testID={`mode-${mode.id}`}
                icon={mode.icon}
                label={mode.title}
                desc={UPDATED_MODE_DESCS[mode.id as StorageMode] || mode.description}
                accent={mode.accent!}
                onPress={() => handleLogin(mode)}
                t={t}
                enterDelay={450 + i * 120}
              />
            ))}
          </View>

          {/* Hint */}
          <Animated.View entering={FadeInDown.delay(850).duration(480)} style={{ marginTop: 24 }}>
            <Text style={{ textAlign: "center", fontSize: 13, color: t.hint }}>
              You can switch modes any time in Settings
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
