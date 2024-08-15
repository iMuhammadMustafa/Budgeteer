import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen } from "expo-router";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Platform, StatusBar } from "react-native";


type ModeType = "dark" | "light" | "system";
type ThemeContextType = {
    theme: ModeType
    isDarkMode: boolean;
    toggleTheme: () => void;
  };

export const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    isDarkMode: false,
    toggleTheme: () => {},
  });

  // const LIGHT_THEME: Theme = {
  //   dark: false,
  //   colors: NAV_THEME.light,
  // };
  // const DARK_THEME: Theme = {
  //   dark: true,
  //   colors: NAV_THEME.dark,
  // };  

export default function ThemeProvider({children}: {children: ReactNode}){
    const [colorMode, setColorMode] = useState<ModeType>("light");
    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);
    
    const toggleColorMode = async () => {
    setColorMode((prev) => (prev === "light" ? "dark" : "light"));
    };

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

return (
    <ThemeContext.Provider value={{ theme: colorMode, isDarkMode: colorMode === "dark" , toggleTheme: toggleColorMode }}>
    <GluestackUIProvider mode={colorMode}>
    <StatusBar barStyle={colorMode === "dark" ? "light-content" : "dark-content"} />
        {children}
    </GluestackUIProvider>
  </ThemeContext.Provider>
)    
}

export const useTheme = () => useContext(ThemeContext);