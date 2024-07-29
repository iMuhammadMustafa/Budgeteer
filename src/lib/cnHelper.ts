import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useColorScheme as useNativewindColorScheme } from "nativewind";

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();
  return {
    colorScheme: colorScheme ?? "dark",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
  };
}

export const NAV_THEME = {
  light: {
    background: "hsl(334 62% 100%)", // background
    border: "hsl(334 5% 95%)", // border
    card: "hsl(334 62% 100%)", // card
    notification: "hsl(18 93% 23%)", // destructive
    primary: "hsl(334 44% 52%)", // primary
    text: "hsl(334 55% 1%)", // foreground
  },
  dark: {
    background: "hsl(217.5 9.09% 17.25%)", // background
    border: "hsl(334 0% 18.46%)", // border
    card: "hsl(210 9.09% 12.94%)", // card
    notification: "hsl(358.16 68.78% 53.53%)", // destructive
    primary: "hsl(226.73 58.43% 65.1%)", // primary
    text: "hsl(334 34% 98%)", // foreground
  },
};
