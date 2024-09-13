import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider as ReactThemeProvider } from "@react-navigation/native";
import { SplashScreen } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform, StatusBar } from "react-native";

import { config, darkVars, lightVars } from "@/components/ui/gluestack-ui-provider/config";

type ModeType = "dark" | "light" | "system";
type ThemeContextType = {
  theme: ModeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDarkMode: false,
  toggleTheme: () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ModeType>("light");
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add(`bg-background`);
      }
      if (!theme) {
        await AsyncStorage.setItem("theme", colorMode);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      if (colorTheme !== colorMode) {
        setColorMode(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (isColorSchemeLoaded) {
      AsyncStorage.setItem("theme", colorMode);
    }
  }, [colorMode, isColorSchemeLoaded]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  const toggleColorMode = async () => {
    setColorMode(prev => (prev === "light" ? "dark" : "light"));
  };

  const convertGlueStackUIThemeToReactNativeColors = (mode: ModeType) => {
    const styles = mode === "dark" ? darkVars : lightVars;

    const result = {
      dark: mode === "dark",
      colors: {
        background: `rgb(${styles["--background"].replace(/ /g, ",")})`, // background
        text: `rgb(${styles["--foreground"].replace(/ /g, ",")})`, // foreground
        card: `rgb(${styles["--card"].replace(/ /g, ",")})`, // card
        border: `rgb(${styles["--border"].replace(/ /g, ",")})`, // border
        primary: `rgb(${styles["--primary"].replace(/ /g, ",")})`, // primary
        notification: `rgb(${styles["--destructive"].replace(/ /g, ",")})`, // destructive
      },
    };
    return result;
  };

  return (
    <ThemeContext.Provider value={{ theme: colorMode, isDarkMode: colorMode === "dark", toggleTheme: toggleColorMode }}>
      <GluestackUIProvider mode={colorMode}>
        <ReactThemeProvider value={convertGlueStackUIThemeToReactNativeColors(colorMode)}>
          <StatusBar barStyle={colorMode === "dark" ? "light-content" : "dark-content"} />
          {children}
        </ReactThemeProvider>
      </GluestackUIProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
