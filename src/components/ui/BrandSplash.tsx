/**
 * BrandSplash — on-brand loading screen shown while fonts load (and on web,
 * where there is no native splash). Sage-paper background + the teal "B" mark,
 * drawn from tokens so it needs no image asset. Rendered inside ThemeProvider
 * so the design-system classes resolve in both light and dark.
 */
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

import { useTheme } from "@/src/providers/ThemeProvider";

export default function BrandSplash() {
  const { colors } = useTheme();
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <View className="w-[68px] h-[68px] rounded-xl bg-primary items-center justify-center">
        <Text className="font-serif text-h1 text-white">B</Text>
      </View>
      <Text className="font-serif text-h2 text-ink mt-5">Budgeteer</Text>
      <Text className="font-sans-semibold text-overline uppercase text-ink-faint mt-2">
        Personal Finance
      </Text>
      <ActivityIndicator color={colors.primary} className="mt-8" />
    </View>
  );
}
