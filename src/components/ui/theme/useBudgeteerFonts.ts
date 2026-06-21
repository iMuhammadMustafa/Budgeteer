/**
 * Budgeteer Design System — font loader hook.
 *
 * Loads the three families the new design system relies on. Called in the root
 * layout; hold the splash screen / branded splash until `fontsLoaded` is true.
 *
 *   const fontsLoaded = useBudgeteerFonts();
 *   if (!fontsLoaded) return <BrandSplash />;
 */
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";

export function useBudgeteerFonts(): boolean {
  const [loaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });
  return loaded;
}
