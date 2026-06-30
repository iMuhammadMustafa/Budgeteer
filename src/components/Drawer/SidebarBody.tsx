import { Pressable, Text, View } from "react-native";
import { router, useSegments } from "expo-router";

import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { NAV_SECTIONS } from "@/src/constants/navigation";
import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";
import { Divider } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";

import Footer from "./Footer";
import SidebarItem from "./SidebarItem";

export default function SidebarBody({ navigation }: { navigation: any }) {
  const segments = useSegments();
  const { isDark, toggleTheme, colors } = useTheme();
  const { storageMode } = useStorageMode();

  const isItemActive = (matchSegment: string, isTabItem: boolean) => {
    if (isTabItem) return segments.includes("(tabs)" as never) && segments.includes(matchSegment as never);
    return segments[1] === matchSegment;
  };

  const go = (path: string) => {
    router.navigate(path as any);
    navigation?.closeDrawer?.();
  };

  return (
    <>
      {/* Brand */}
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Text className="font-serif text-h3 text-white">B</Text>
        </View>
        <View>
          <Text className="font-serif text-h3 text-ink">Budgeteer</Text>
          <Text className="font-sans-semibold text-overline uppercase text-ink-faint">Personal Finance</Text>
        </View>
      </View>
      <Divider className="mt-2" />

      {/* Nav sections */}
      {NAV_SECTIONS.map((section, i) => (
        <View key={section.title} className="mt-2">
          {i > 0 && <Divider className="mx-4 my-1" inset={15} />}
          <Text className="px-4 pb-1 pt-2 font-sans-semibold text-overline uppercase text-ink-faint">
            {section.title}
          </Text>
          {section.items.map(item => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={isItemActive(item.matchSegment, item.isTabItem)}
              onPress={() => go(item.path)}
            />
          ))}
        </View>
      ))}

      <View style={{ flex: 1 }} />
      <Divider className="mx-4 my-1" inset={15} />
      {/* Storage mode status (plain row, not a card) */}
      {storageMode ? (
        <View className="mx-2 mb-0.5 mt-2 flex-row items-center gap-3 px-3 py-2">
          <MyIcon name={StorageModeConfig[storageMode].iconName} size={18} color={colors.primary} />
          <View className="flex-1">
            <Text className="font-sans-semibold text-sm text-ink">{StorageModeConfig[storageMode].title}</Text>
            <Text className="font-sans text-xs text-ink-faint">{StorageModeConfig[storageMode].sub}</Text>
          </View>
        </View>
      ) : null}

      {/* Theme toggle (plain row) */}
      <Pressable
        onPress={toggleTheme}
        className="mx-2 mb-1 flex-row items-center gap-3 rounded-md px-3 py-2 active:bg-surface-alt"
      >
        <MyIcon name={isDark ? "Sun" : "Moon"} size={18} color={colors.inkMute} />
        <Text className="font-sans-medium text-sm text-ink-mute">{isDark ? "Light mode" : "Dark mode"}</Text>
      </Pressable>

      <View className="mx-4 my-2 h-px bg-border" />
      <Footer />
    </>
  );
}
