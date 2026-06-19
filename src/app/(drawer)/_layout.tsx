import DashboardSkeleton from "@/src/components/Charts/DashboardSkeleton";
import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import ThemedText from "@/src/components/elements/ThemedText";
import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { DrawerContentScrollView, DrawerItemList } from "expo-router/build/react-navigation/drawer";
import { router, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, useWindowDimensions, View } from "react-native";

const LARGE_SCREEN_BREAKPOINT = 1024;

const SIDEBAR_SECTIONS = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: "House", path: "/Dashboard", matchSegment: "Dashboard", isTabItem: true },
      { label: "Transactions", icon: "ArrowRightLeft", path: "/Transactions", matchSegment: "Transactions", isTabItem: true },
      { label: "New Transaction", icon: "ListPlus", path: "/AddTransaction", matchSegment: "AddTransaction", isTabItem: true },
      { label: "Recurrings", icon: "Clock10", path: "/Recurrings", matchSegment: "Recurrings", isTabItem: true },
      { label: "Summary", icon: "Group", path: "/Summary", matchSegment: "Summary", isTabItem: true },
    ],
  },
  {
    title: "FINANCES",
    items: [
      { label: "Accounts", icon: "Landmark", path: "/Accounts", matchSegment: "Accounts", isTabItem: false },
      { label: "Categories", icon: "ChartBarStacked", path: "/Categories", matchSegment: "Categories", isTabItem: false },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", icon: "Settings", path: "/Settings", matchSegment: "Settings", isTabItem: false },
      { label: "Restore", icon: "History", path: "/Restore", matchSegment: "Restore", isTabItem: false },
    ],
  },
];

function SidebarItem({ label, icon, isActive, onPress }: { label: string; icon: string; isActive: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3 mx-3 my-0.5 rounded-xl ${isActive ? "bg-primary" : ""}`}
      style={({ pressed }) => [{ opacity: pressed && !isActive ? 0.7 : 1 }]}
    >
      <MyIcon
        name={icon}
        size={20}
        className={isActive ? "text-primary-foreground" : "text-text-secondary"}
      />
      <ThemedText
        className={`ml-3 text-sm ${isActive ? "text-primary-foreground font-medium" : "text-foreground"}`}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <ThemedText className="text-xs font-semibold tracking-wider text-text-tertiary px-6 pt-5 pb-2">
      {title}
    </ThemedText>
  );
}

function SidebarBranding() {
  return (
    <View className="px-5 pt-6 pb-4 flex-row items-center">
      <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
        <ThemedText className="text-primary-foreground font-bold text-base">B</ThemedText>
      </View>
      <View>
        <ThemedText className="text-base font-bold text-foreground">Budgeteer</ThemedText>
        <ThemedText className="text-xs text-text-secondary">Personal Finance</ThemedText>
      </View>
    </View>
  );
}

function DesktopDrawerContent(props: any) {
  const segments = useSegments();

  const isItemActive = (matchSegment: string, isTabItem: boolean) => {
    if (isTabItem) {
      // Tab items: match when we're inside (tabs) group AND on this specific tab
      return segments.includes("(tabs)" as never) && segments.includes(matchSegment as never);
    }
    // Drawer items: match the direct child of (drawer) group
    return segments[1] === matchSegment;
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <SidebarBranding />

      {SIDEBAR_SECTIONS.map((section, sectionIndex) => (
        <View key={section.title}>
          {sectionIndex > 0 && <View className="h-px bg-border-subtle mx-5 my-1" />}
          <SectionHeader title={section.title} />
          {section.items.map(item => (
            <SidebarItem
              key={item.path}
              label={item.label}
              icon={item.icon}
              isActive={isItemActive(item.matchSegment, item.isTabItem)}
              onPress={() => router.navigate(item.path as any)}
            />
          ))}
        </View>
      ))}

      <View style={{ flex: 1 }} />

      <View className="pb-2">
        <View className="h-px bg-border-subtle mx-5 my-2" />
        <Footer />
      </View>
    </DrawerContentScrollView>
  );
}

function MobileDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} className="flex-1">
      <DrawerItemList {...(props as any)} />
      <Footer />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { isLoading: isAuthLoading, session } = useAuth();
  const { isLoading: isStorageLoading } = useStorageMode();
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;
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
        drawerType: isLargeScreen ? "permanent" : "slide",
        drawerStyle: isLargeScreen ? { width: 280 } : undefined,
        headerTintColor: isDarkMode ? "white" : "black",
        headerLeft: isLargeScreen ? () => null : undefined,
        headerRight: () => (
          <Button onPress={toggleTheme} rightIcon={isDarkMode ? "Sun" : "Moon"} variant="ghost" iconSize={24} />
        ),
      }}
      drawerContent={props =>
        isLargeScreen ? <DesktopDrawerContent {...props} /> : <MobileDrawerContent {...props} />
      }
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Dashboard",
          title: "Main",
          drawerIcon: ({ color }: any) => <MyIcon name="House" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Accounts"
        options={{
          drawerLabel: "Accounts",
          title: "Accounts",
          drawerIcon: ({ color }: any) => <MyIcon name="Landmark" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Categories"
        options={{
          drawerLabel: "Categories",
          title: "Categories",
          drawerIcon: ({ color }: any) => <MyIcon name="ChartBarStacked" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Restore"
        options={{
          drawerLabel: "Restore",
          title: "Restore",
          drawerIcon: ({ color }: any) => <MyIcon name="History" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: ({ color }: any) => <MyIcon name="Settings" color={color} size={24} />,
        }}
      />
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
