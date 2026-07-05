import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { DrawerContentScrollView } from "expo-router/build/react-navigation/drawer";
import { Drawer } from "expo-router/drawer";

import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { BREAKPOINT_DESKTOP, DRAWER_WIDTH_MOBILE, SIDEBAR_WIDTH } from "@/src/constants/layout";
import { GridBackground } from "@/src/components/ui";
import Topbar from "@/src/components/ui/Topbar";
import DashboardSkeleton from "@/src/components/dashboard/DashboardSkeleton";
import SidebarBody from "@/src/components/Drawer/SidebarBody";

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
    <>
      <GridBackground />
      <Drawer
        screenOptions={{
          header: () => <Topbar isLargeScreen={isLargeScreen} />,
          sceneStyle: { backgroundColor: "transparent" },
          // Freeze blurred drawer screens so they stop re-rendering in the
          // background (TanStack refetch-on-mount refreshes them on return).
          freezeOnBlur: true,
          drawerType: isLargeScreen ? "permanent" : "slide",
          drawerStyle: isLargeScreen
            ? {
                width: SIDEBAR_WIDTH,
                borderRightColor: colors.border,
                borderRightWidth: 1,
                backgroundColor: colors.surface,
              }
            : { width: DRAWER_WIDTH_MOBILE, backgroundColor: colors.surface },
          // overlayColor: "rgba(10,10,12,0.45)",
        }}
        drawerContent={props => (
          <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.surface }}
          >
            <SidebarBody navigation={props.navigation} />
          </DrawerContentScrollView>
        )}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: "Dashboard", title: "Main" }} />
        <Drawer.Screen name="Accounts" options={{ drawerLabel: "Accounts", title: "Accounts" }} />
        <Drawer.Screen name="Categories" options={{ drawerLabel: "Categories", title: "Categories" }} />
        <Drawer.Screen name="Restore" options={{ drawerLabel: "Restore", title: "Restore" }} />
        <Drawer.Screen name="Settings" options={{ drawerLabel: "Settings", title: "Settings" }} />
      </Drawer>
    </>
  );
}
