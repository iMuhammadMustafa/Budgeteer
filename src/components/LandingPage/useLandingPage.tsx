import { useCallback, useEffect } from "react";
import { useWindowDimensions } from "react-native";

import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { StorageMode } from "@/src/types/StorageMode";
import { buildLocalSession } from "@/src/utils/localSession";
import { router } from "expo-router";

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

export default function useLandingPage() {
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
        await setSession(buildLocalSession(StorageMode.Local), StorageMode.Local);
      }
      if (mode.id === StorageMode.Demo) {
        await setSession(buildLocalSession(StorageMode.Demo), StorageMode.Demo);
      }
      console.log("Navigating to Dashboard");
      return router.push("/Dashboard");
    },
    [session, setSession, storageMode, setStorageMode, logout],
  );

  return {
    isLoading,
    isDesktop,
    isDark,
    orbs,
    barPrimary,
    barAccent,
    handleLogin,
    toggleTheme,
  };
}
