import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import * as Updates from "expo-updates";

import supabase from "@/src/providers/Supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";

import MyIcon from "@/src/utils/Icons.Helper";
import { resetMockDataInLocalStorage } from "@/src/repositories/__mock__/mockDataLocalStorage";
import Notification from "@/src/components/Notification";
import DemoModeIndicator from "@/src/components/DemoModeIndicator";
import { useEffect } from "react";

export default function DrawerLayout() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { session, isSessionLoading } = useAuth();

  // useAutoApplyRecurrings({
  //   enableLogging: true,
  //   skipOnError: true,
  //   delayMs: 2000,
  //   enableNotifications: true,
  // });

  useEffect(() => {
    if (!isSessionLoading && (!session || !session.user)) {
      console.log("No session found, navigating to login");
      router.navigate("/(auth)/Login");
    }
  }, [isSessionLoading, session]);

  if (isSessionLoading) return <ActivityIndicator />;
  if (!isSessionLoading && (!session || !session.user)) {
    console.log("No session found");
    router.navigate("/Login");
  }

  return (
    <>
      <Drawer
        screenOptions={{
          drawerType: "slide",
          headerTintColor: isDarkMode ? "white" : "black",
          headerRight: () => <HeaderRight toggleTheme={toggleTheme} isDarkMode={isDarkMode} />,
        }}
        drawerContent={props => <DrawerContent {...props} />}
      >
        {DashboardScreen}
        {AccountsScreen}
        {CategoriesScreen}
        {SettingsScreen}
      </Drawer>
      <Notification />
    </>
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

const HeaderRight = ({ toggleTheme, isDarkMode }: { toggleTheme: () => void; isDarkMode: boolean }) => (
  <View className="flex-row items-center mr-4">
    <DemoModeIndicator variant="badge" className="mr-3" />
    <Pressable
      onPress={() => {
        toggleTheme();
      }}
    >
      <MyIcon
        name={isDarkMode ? "Sun" : "Moon"}
        size={24}
        color={isDarkMode ? "white" : "black"}
      />
    </Pressable>
  </View>
);

const DrawerContent = (props: any) => {
  return (
    <DrawerContentScrollView {...props} className="flex-1">
      <DemoModeIndicator variant="banner" className="mb-2" />
      <DrawerItemList {...props} />
      <Footer />
    </DrawerContentScrollView>
  );
};
const Footer = () => {
  const { currentlyRunning, isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  const { logout, isDemoLoaded } = useAuth();

  const handleLogout = async () => {
    await logout();
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

      {isDemoLoaded && (
        <View className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md mt-2 mb-2">
          <Text className="text-yellow-800 dark:text-yellow-200 text-center text-sm">
            You're exploring with demo data. All changes will be cleared when you log out.
          </Text>
        </View>
      )}

      <Pressable onPress={handleLogout} className="bg-danger-100 p-2 rounded-md mt-2">
        <Text className="text-foreground text-center">
          {isDemoLoaded ? "Exit Demo Mode" : "Logout"}
        </Text>
      </Pressable>
    </>
  );
};
