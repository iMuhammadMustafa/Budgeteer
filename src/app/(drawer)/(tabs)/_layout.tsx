import MyIcon from "@/src/components/elements/MyIcon";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarButtonTestID: "tab-dashboard",
          tabBarIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Transactions"
        options={{
          title: "Transactions",
          tabBarButtonTestID: "tab-transactions",
          tabBarIcon: ({ color }) => <MyIcon name="ArrowRightLeft" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="AddTransaction"
        options={{
          title: "New Transaction",
          tabBarButtonTestID: "tab-add-transaction",
          tabBarIcon: ({ color }) => <MyIcon name="ListPlus" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Recurrings"
        options={{
          title: "Recurrings",
          tabBarButtonTestID: "tab-recurrings",
          tabBarIcon: ({ color }) => <MyIcon name="Clock10" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Summary"
        options={{
          title: "Summary",
          tabBarButtonTestID: "tab-summary",
          tabBarIcon: ({ color }) => <MyIcon name="Group" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
