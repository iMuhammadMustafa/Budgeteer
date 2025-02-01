import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider as ReactThemeProvider } from "@react-navigation/native";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform, StatusBar, View } from "react-native";

import { convertThemeToReactNativeColors, nativewindConfig } from "@/src/utils/theme.config";
import { ThemeContextType, ThemeMode } from "../types/utils/Theme.Type";
import { useColorScheme } from "nativewind";

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>(colorScheme || "light");
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (Platform.OS === "web") {
          document.documentElement.classList.add(`bg-background`); // Adds the background color to the html element to prevent white background on overscroll.
        }
        if (savedTheme) {
          setTheme(savedTheme === "dark" ? "dark" : "light");
          setColorScheme(savedTheme === "dark" ? "dark" : "light");
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      } finally {
        setIsColorSchemeLoaded(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (isColorSchemeLoaded) {
      AsyncStorage.setItem("theme", theme);
      setColorScheme(theme);
    }
  }, [theme, isColorSchemeLoaded]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  const toggleColorMode = async () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme: theme, isDarkMode: theme === "dark", toggleTheme: toggleColorMode }}>
      <ReactThemeProvider value={convertThemeToReactNativeColors(theme)}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={theme === "dark" ? "black" : "white"}
        />
        <View className="flex-1" style={nativewindConfig[theme]}>
          {children}
        </View>
      </ReactThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
