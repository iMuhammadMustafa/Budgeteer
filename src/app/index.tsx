import { Platform, Text, View } from "react-native";

import MobileView from "@/src/components/LandingPage/LandingMobileView";
import useLandingPage from "@/src/components/LandingPage/useLandingPage";
import WebSplit from "@/src/components/LandingPage/WebSplit";

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
