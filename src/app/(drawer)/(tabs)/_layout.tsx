import MyIcon from "@/src/components/elements/MyIcon";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color }) => <MyIcon name="ArrowRightLeft" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="AddTransaction"
        options={{
          title: "New Transaction",
          tabBarIcon: ({ color }) => <MyIcon name="ListPlus" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Recurrings"
        options={{
          title: "Recurrings",
          tabBarIcon: ({ color }) => <MyIcon name="Clock10" color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="Summary"
        options={{
          title: "Summary",
          tabBarIcon: ({ color }) => <MyIcon name="Group" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
