import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider as ReactThemeProvider } from "@react-navigation/native";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform, StatusBar, View } from "react-native";

import { applyRootVariables, convertThemeToReactNativeColors, nativewindConfig } from "@/src/utils/theme.config";
import { useColorScheme } from "nativewind";

export type ThemeMode = "dark" | "light";

export type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(colorScheme || "light");

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("theme");
      setTheme(savedTheme === "dark" ? "dark" : "light");
      setColorScheme(savedTheme === "dark" ? "dark" : "light");
      applyRootVariables(savedTheme === "dark" ? "dark" : "light");
    };
    if (Platform.OS === "web") {
      document.documentElement.classList.add("bg-background");
    }

    loadTheme();
  }, [setColorScheme]);

  const reactNavigationTheme = useMemo(() => convertThemeToReactNativeColors(theme), [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      toggleTheme: () => {
        setTheme(prev => {
          const newTheme = prev === "light" ? "dark" : "light";
          AsyncStorage.setItem("theme", newTheme);
          setColorScheme(newTheme);
          applyRootVariables(newTheme);
          return newTheme;
        });
      },
    }),
    [theme, setColorScheme],
  );

  const nativeWindStyle = useMemo(() => (Platform.OS !== "web" ? nativewindConfig[theme] : {}), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ReactThemeProvider value={reactNavigationTheme}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={theme === "dark" ? "black" : "white"}
        />
        <View className="flex-1" style={nativeWindStyle}>
          {children}
        </View>
      </ReactThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
