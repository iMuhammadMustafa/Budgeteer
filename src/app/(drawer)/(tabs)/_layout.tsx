import MyIcon from "@/src/components/elements/MyIcon";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";

const LARGE_SCREEN_BREAKPOINT = 1024;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isLargeScreen ? { display: "none" } : undefined,
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
          title: "New Transaction",
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
