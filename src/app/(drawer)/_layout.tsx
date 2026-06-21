import DashboardSkeleton from "@/src/components/Charts/DashboardSkeleton";
import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import ThemedText from "@/src/components/elements/ThemedText";
import Topbar from "@/src/components/ui/Topbar";
import { BREAKPOINT_DESKTOP, DRAWER_WIDTH_MOBILE, SIDEBAR_WIDTH } from "@/src/constants/layout";
import { NAV_SECTIONS } from "@/src/constants/navigation";
import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";
import { router, useSegments } from "expo-router";
import { DrawerContentScrollView } from "expo-router/build/react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";

const STORAGE_META: Record<StorageMode, { icon: string; sub: string }> = {
  [StorageMode.Cloud]: { icon: "Cloud", sub: "All devices synced" },
  [StorageMode.Local]: { icon: "Smartphone", sub: "Private on this device" },
  [StorageMode.Demo]: { icon: "Gamepad2", sub: "Sample data" },
};

function SidebarItem({
  item,
  isActive,
  onPress,
}: {
  item: { label: string; icon: string };
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className={`mx-2 my-0.5 flex-row items-center gap-3 rounded-[8px] px-3 py-2.5 ${isActive ? "bg-primary-soft" : "active:bg-surface-alt"}`}
    >
      <MyIcon name={item.icon} size={20} color={isActive ? colors.primaryDeep : colors.inkMute} />
      <Text className={`text-body ${isActive ? "font-sans-bold text-primary-deep" : "font-sans-medium text-ink-mute"}`}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function SidebarBody({ navigation }: { navigation: any }) {
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

  const meta = storageMode ? STORAGE_META[storageMode] : null;

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

      {/* New Transaction */}
      <Pressable
        onPress={() => go("/AddTransaction")}
        className="mx-2 mb-1 flex-row items-center justify-center gap-2 rounded-[8px] bg-primary py-3 active:opacity-90"
      >
        <MyIcon name="Plus" size={18} color="#FFFFFF" />
        <Text className="font-sans-bold text-body text-white">New Transaction</Text>
      </Pressable>

      {/* Nav sections */}
      {NAV_SECTIONS.map((section, i) => (
        <View key={section.title} className="mt-3">
          {i > 0 && <View className="mx-4 my-1 h-px bg-border" />}
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
      <View className="mx-4 my-1 h-px bg-border" />
      {/* Storage mode status (plain row, not a card) */}
      {meta && storageMode ? (
        <View className="mx-2 mb-0.5 mt-2 flex-row items-center gap-3 px-3 py-2">
          <MyIcon name={meta.icon} size={18} color={colors.primary} />
          <View className="flex-1">
            <Text className="font-sans-semibold text-sm text-ink">{StorageModeConfig[storageMode].title}</Text>
            <Text className="font-sans text-xs text-ink-faint">{meta.sub}</Text>
          </View>
        </View>
      ) : null}

      {/* Theme toggle (plain row) */}
      <Pressable
        onPress={toggleTheme}
        className="mx-2 mb-1 flex-row items-center gap-3 rounded-[8px] px-3 py-2 active:bg-surface-alt"
      >
        <MyIcon name={isDark ? "Sun" : "Moon"} size={18} color={colors.inkMute} />
        <Text className="font-sans-medium text-sm text-ink-mute">{isDark ? "Light mode" : "Dark mode"}</Text>
      </Pressable>

      <View className="mx-4 my-2 h-px bg-border" />
      <Footer />
    </>
  );
}

function SidebarContent(props: any) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      className="bg-surface"
    >
      <SidebarBody navigation={props.navigation} />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { colors } = useTheme();
  const { isLoading: isAuthLoading, session } = useAuth();
  const { isLoading: isStorageLoading } = useStorageMode();
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= BREAKPOINT_DESKTOP;
  const isLoading = isAuthLoading || isStorageLoading;

  useEffect(() => {
    if (!session && !isLoading) {
      router.replace("/");
    }
  }, [session, isLoading]);

  if (isLoading || !session) return <DashboardSkeleton />;

  return (
    <Drawer
      screenOptions={{
        header: () => <Topbar isLargeScreen={isLargeScreen} />,
        drawerType: isLargeScreen ? "permanent" : "slide",
        drawerStyle: isLargeScreen
          ? {
              width: SIDEBAR_WIDTH,
              borderRightColor: colors.border,
              borderRightWidth: 1,
              backgroundColor: colors.surface,
            }
          : { width: DRAWER_WIDTH_MOBILE, backgroundColor: colors.surface },
        overlayColor: "rgba(10,10,12,0.45)",
      }}
      drawerContent={props => <SidebarContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: "Dashboard", title: "Main" }} />
      <Drawer.Screen name="Accounts" options={{ drawerLabel: "Accounts", title: "Accounts" }} />
      <Drawer.Screen name="Categories" options={{ drawerLabel: "Categories", title: "Categories" }} />
      <Drawer.Screen name="Restore" options={{ drawerLabel: "Restore", title: "Restore" }} />
      <Drawer.Screen name="Settings" options={{ drawerLabel: "Settings", title: "Settings" }} />
    </Drawer>
  );
}

const Footer = () => {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  const { logout } = useAuth();
  const { setStorageMode } = useStorageMode();

  return (
    <>
      <View className="flex-row justify-around items-center py-2">
        <ThemedText
          className="text-center"
          onPress={async () => {
            if (Platform.OS !== "web") await Updates.checkForUpdateAsync();
          }}
        >
          Version 0.16.11
        </ThemedText>
        {isUpdatePending && !isDownloading && (
          <Button onPress={async () => await Updates.reloadAsync()} variant="outline" rightIcon="Power" size="sm" />
        )}
        {isDownloading && <ActivityIndicator size="small" color="black" />}
        {isUpdateAvailable && !isUpdatePending && !isDownloading && (
          <Button
            onPress={async () => await Updates.fetchUpdateAsync()}
            variant="outline"
            rightIcon="CloudDownload"
            size="sm"
          />
        )}
      </View>
      <Button
        label="Logout"
        onPress={() => {
          logout();
          setStorageMode(null);
        }}
        variant="destructive"
        rightIcon="LogOut"
        size="sm"
      />
      <Button
        label="Clear Cache"
        onPress={() => {
          queryClient.clear();
          queryClient.resetQueries();
        }}
        variant="ghost"
        size="sm"
        rightIcon="Trash"
      />
    </>
  );
};
