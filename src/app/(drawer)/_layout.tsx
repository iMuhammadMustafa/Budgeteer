import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import * as Updates from "expo-updates";

import supabase from "@/src/providers/Supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

import MyIcon from "@/src/utils/Icons.Helper";
import Button from "@/src/components/Button";
import { useDemoMode } from "@/src/providers/DemoModeProvider";
import {
  initializeMockDataInLocalStorage,
  resetMockDataInLocalStorage,
} from "@/src/repositories/__mock__/mockDataLocalStorage";
import NotificationsProvider from "@/src/providers/NotificationsProvider";
import Notification from "@/src/components/Notification";
import { useAutoApplyStartupSimple } from "@/src/hooks/useAutoApplyStartup";

export default function DrawerLayout() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;
  if (!isSessionLoading && (!session || !session.user)) router.navigate("/Login");

  return (
    <NotificationsProvider>
      <GestureHandlerRootView className="flex-1">
        <Drawer
          screenOptions={{
            drawerType: "slide",
            headerTintColor: isDarkMode ? "white" : "black",
            headerRight: () => <ThemeToggler toggleTheme={toggleTheme} isDarkMode={isDarkMode} />,
          }}
          drawerContent={props => <DrawerContent {...props} />}
        >
          {DashboardScreen}
          {AccountsScreen}
          {CategoriesScreen}
          {SettingsScreen}
        </Drawer>
        <Notification />
        <AutoApplyStartupManager />
      </GestureHandlerRootView>
    </NotificationsProvider>
  );
}

const DashboardScreen = (
  <Drawer.Screen
    name="(tabs)" // This is the name of the page and must match the url from root
    options={{
      drawerLabel: "Dashboard",
      title: "Main",
      drawerIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
    }}
  />
);
const AccountsScreen = (
  <Drawer.Screen
    name="Accounts"
    options={{
      drawerLabel: "Accounts",
      title: "Accounts",
      drawerIcon: ({ color }) => <MyIcon name="Landmark" color={color} size={24} />,
    }}
  />
);
const CategoriesScreen = (
  <Drawer.Screen
    name="Categories"
    options={{
      drawerLabel: "Categories",
      title: "Categories",
      drawerIcon: ({ color }) => <MyIcon name="ChartBarStacked" color={color} size={24} />,
    }}
  />
);
const SettingsScreen = (
  <Drawer.Screen
    name="Settings"
    options={{
      drawerLabel: "Settings",
      title: "Settings",
      drawerIcon: ({ color }) => <MyIcon name="Settings" color={color} size={24} />,
    }}
  />
);

function ThemeToggler({ toggleTheme, isDarkMode }: { toggleTheme: () => void; isDarkMode: boolean }) {
  return (
    <Pressable
      onPress={() => {
        toggleTheme();
      }}
    >
      <MyIcon
        name={isDarkMode ? "Sun" : "Moon"}
        size={24}
        color={isDarkMode ? "white" : "black"}
        style={{ marginRight: 30 }}
      />
    </Pressable>
  );
}

/**
 * Component responsible for managing auto-apply functionality on app startup
 * This component is invisible but handles the initialization and monitoring of auto-apply
 */
function AutoApplyStartupManager() {
  const autoApplyStartup = useAutoApplyStartupSimple({
    enableLogging: true,
    skipOnError: true,
    delayMs: 2000, // 2 second delay to allow app to fully load
    enableNotifications: true,
  });

  // Log startup progress for debugging
  useEffect(() => {
    if (autoApplyStartup.isComplete && autoApplyStartup.hasResults) {
      console.log("[AutoApply Startup] Initialization complete:", {
        totalProcessed: autoApplyStartup.totalProcessed,
        hasError: autoApplyStartup.hasError,
      });
    }
  }, [
    autoApplyStartup.isComplete,
    autoApplyStartup.hasResults,
    autoApplyStartup.totalProcessed,
    autoApplyStartup.hasError,
  ]);

  // This component doesn't render anything visible
  return null;
}

function DrawerContent(props: any) {
  // const { isDemo } = useDemoMode();

  // useEffect(() => {
  //   if (isDemo) {
  //     initializeMockDataInLocalStorage();
  //   }
  // }, [isDemo]);

  return (
    <DrawerContentScrollView {...props} className="flex-1">
      {/* {isDemo && (
        <View className="bg-yellow-300 p-2 mb-2 rounded-md items-center">
          <Text className="text-black font-bold">Demo Mode</Text>
        </View>
      )} */}
      <DrawerItemList {...props} />
      <Footer />
    </DrawerContentScrollView>
  );
}
const Footer = () => {
  const { currentlyRunning, isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  // const { setDemo, isDemo } = useDemoMode();

  const handleLogout = () => {
    // setDemo(false);
    router.navigate("/(auth)/Logout");
    supabase.auth.signOut();
  };

  const handleResetDemoData = () => {
    resetMockDataInLocalStorage();
    // Optionally, reload the app to reflect changes
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <>
      <View className="flex-row justify-around items-center py-2">
        <Text className="text-foreground text-center" onPress={async () => await Updates.checkForUpdateAsync()}>
          Version 0.16.11
        </Text>
        {isUpdatePending && !isDownloading && (
          <Pressable onPress={async () => await Updates.reloadAsync()}>
            <MyIcon name="Power" size={24} color="black" />
          </Pressable>
        )}
        {isDownloading && <ActivityIndicator size="small" color="black" />}
        {isUpdateAvailable && !isUpdatePending && !isDownloading && (
          <Pressable onPress={async () => await Updates.fetchUpdateAsync()}>
            <MyIcon name="CloudDownload" size={24} color="black" />
          </Pressable>
        )}
      </View>

      {/* {isDemo && (
        <Pressable onPress={handleResetDemoData} className="bg-yellow-200 p-2 rounded-md mt-2 mb-2">
          <Text className="text-black text-center font-bold">Reset Demo Data</Text>
        </Pressable>
      )} */}

      <Pressable onPress={handleLogout} className="bg-danger-100 p-2 rounded-md mt-2">
        <Text className="text-foreground text-center">Logout</Text>
      </Pressable>
    </>
  );
};
