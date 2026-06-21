import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider as ReactThemeProvider } from "expo-router/react-navigation";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform, StatusBar, View } from "react-native";

import { getColors, type ThemeColors } from "@/src/components/ui/theme/tokens";
import { applyRootVariables, convertThemeToReactNativeColors, nativewindConfig } from "@/src/utils/theme.config";
import { useColorScheme } from "nativewind";

export type ThemeMode = "dark" | "light";

export type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  /** Alias of `isDarkMode` (design-system naming). */
  isDark: boolean;
  /** Resolved literal palette for charts/SVG/icon props that can't use a className. */
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
  /** Paper grid background toggle (rendered by the shell via GridBackground). */
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  isDark: false,
  colors: getColors("light"),
  toggleTheme: () => {},
  setTheme: () => {},
  showGrid: true,
  setShowGrid: () => {},
});

// Match the new Sage Paper background tokens (#F4F1E9 light / #121315 dark).
const STATUS_BAR_COLORS = {
  dark: "#121315",
  light: "#F4F1E9",
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>(colorScheme || "light");
  const [showGrid, setShowGridState] = useState(true);

  const applyTheme = (value: ThemeMode, persist = true) => {
    setThemeState(value);
    setColorScheme(value);
    applyRootVariables(value);
    if (persist) AsyncStorage.setItem("theme", value);
  };

  useEffect(() => {
    const loadPreferences = async () => {
      const [savedTheme, savedGrid] = await Promise.all([
        AsyncStorage.getItem("theme"),
        AsyncStorage.getItem("showGrid"),
      ]);
      const themeValue: ThemeMode = savedTheme === "dark" ? "dark" : "light";
      applyTheme(themeValue, false);
      if (savedGrid !== null) setShowGridState(savedGrid === "true");
    };
    if (Platform.OS === "web") {
      document.documentElement.classList.add("bg-background");
    }

    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setColorScheme]);

  const reactNavigationTheme = useMemo(() => convertThemeToReactNativeColors(theme), [theme]);

  const setShowGrid = (show: boolean) => {
    setShowGridState(show);
    AsyncStorage.setItem("showGrid", show ? "true" : "false");
  };

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      isDark: theme === "dark",
      colors: getColors(theme),
      setTheme: (t: ThemeMode) => applyTheme(t),
      toggleTheme: () => applyTheme(theme === "light" ? "dark" : "light"),
      showGrid,
      setShowGrid,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, showGrid],
  );

  const nativeWindStyle = useMemo(() => (Platform.OS !== "web" ? nativewindConfig[theme] : {}), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ReactThemeProvider value={reactNavigationTheme}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={STATUS_BAR_COLORS[theme]}
        />
        <View className="flex-1" style={nativeWindStyle}>
          {children}
        </View>
      </ReactThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
