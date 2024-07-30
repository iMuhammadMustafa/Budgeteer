import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useEffect } from "react";

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();

  useEffect(() => {
    console.log(colorScheme);
  }, [colorScheme]);

  return {
    colorScheme: colorScheme ?? "dark",
    isDarkColorScheme: colorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
  };
}

export const NAV_THEME = {
  light: {
    background: "hsl(181 30% 99%)", // background
    text: "hsl(181 69% 2%)", // foreground
    card: "hsl(180 16.67% 97.65%)", // card
    border: "hsl(220 13% 91%)", // border
    primary: "hsl(181 49.17% 57.93%)", // primary
    notification: "hsl(1 86% 30%)", // destructive
  },
  dark: {
    background: "hsl(210 19% 8%)", // background
    text: "hsl(0 0% 100%)", // foreground
    card: "hsl(210 19% 6%)", // card
    border: "hsl(210 9% 13%)", // border
    primary: "hsl(167.37 29.19% 22.27%)", // primary
    notification: "hsl(1 95% 57%)", // destructive
  },
};
