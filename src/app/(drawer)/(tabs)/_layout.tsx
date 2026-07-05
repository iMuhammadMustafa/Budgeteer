import { useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/providers/ThemeProvider";
import { BREAKPOINT_DESKTOP } from "@/src/constants/layout";
import MyIcon from "@/src/components/elements/MyIcon";

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isLargeScreen = width >= BREAKPOINT_DESKTOP;
  const bottomInset = insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Mount each tab lazily on first visit and freeze it while blurred so
        // off-screen tabs (e.g. the 6-chart Dashboard) don't keep re-rendering.
        lazy: true,
        freezeOnBlur: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: "HankenGrotesk_600SemiBold", fontSize: 11, lineHeight: 14 },
        tabBarStyle: isLargeScreen
          ? { display: "none" }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 64 + bottomInset,
              paddingTop: 5,
            },
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarButtonTestID: "tab-dashboard",
          tabBarIcon: ({ color }) => <MyIcon name="House" color={color as string} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Transactions"
        options={{
          title: "Transactions",
          tabBarButtonTestID: "tab-transactions",
          tabBarIcon: ({ color }) => <MyIcon name="ArrowRightLeft" color={color as string} size={24} />,
        }}
      />

      <Tabs.Screen
        name="AddTransaction"
        options={{
          title: "Add Transaction",
          tabBarButtonTestID: "tab-add-transaction",
          tabBarIcon: ({ color }) => <MyIcon name="ListPlus" color={color as string} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Recurrings"
        options={{
          title: "Recurrings",
          tabBarButtonTestID: "tab-recurrings",
          tabBarIcon: ({ color }) => <MyIcon name="Clock10" color={color as string} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Summary"
        options={{
          title: "Summary",
          tabBarButtonTestID: "tab-summary",
          tabBarIcon: ({ color }) => <MyIcon name="Group" color={color as string} size={24} />,
        }}
      />
    </Tabs>
  );
}
