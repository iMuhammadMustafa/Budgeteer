/**
 * Topbar — the shell's sticky top bar, plugged into the navigator's `header`
 * slot so safe-area / status-bar insets are handled by react-navigation +
 * react-native-safe-area-context (no per-screen padding needed).
 *
 * Layout: hamburger (mobile only) on the left · page title centered (serif) ·
 * right cluster with an optional page refresh (registered via
 * useHeaderRefresh) + the theme toggle. Title is derived from the current
 * route segments via the shared nav model, so it works for nested tab screens.
 */
import { useNavigation, useSegments } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MyIcon from "@/src/components/elements/MyIcon";
import { TOPBAR_HEIGHT } from "@/src/constants/layout";
import { findNavItemBySegment } from "@/src/constants/navigation";
import { useHeaderActions } from "@/src/providers/HeaderActionsProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function Topbar({ isLargeScreen }: { isLargeScreen?: boolean }) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const navigation = useNavigation<any>();
  const { isDark, toggleTheme, colors } = useTheme();
  const { refresh } = useHeaderActions();

  // Deepest segment that maps to a nav item wins (handles nested tab screens).
  const title =
    [...segments].reverse().map(s => findNavItemBySegment(s)?.label).find(Boolean) ?? "Budgeteer";

  return (
    <View style={{ paddingTop: insets.top }} className="bg-surface border-b border-border">
      <View style={{ height: TOPBAR_HEIGHT }} className="flex-row items-center px-4">
        <View className="w-10 items-start justify-center">
          {!isLargeScreen ? (
            <Pressable hitSlop={10} onPress={() => navigation.openDrawer?.()} testID="topbar-menu">
              <MyIcon name="Menu" size={24} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>

        <Text numberOfLines={1} className="flex-1 text-center font-serif text-h3 text-ink">
          {title}
        </Text>

        <View className="flex-row items-center justify-end gap-1" style={{ minWidth: 40 }}>
          {refresh?.onRefresh ? (
            refresh.refreshing ? (
              <View className="px-1.5">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <Pressable hitSlop={10} onPress={refresh.onRefresh} testID="topbar-refresh" className="p-1.5">
                <MyIcon name="RefreshCcw" size={20} color={colors.inkMute} />
              </Pressable>
            )
          ) : null}
          <Pressable hitSlop={10} onPress={toggleTheme} testID="topbar-theme-toggle" className="p-1.5">
            <MyIcon name={isDark ? "Sun" : "Moon"} size={22} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
