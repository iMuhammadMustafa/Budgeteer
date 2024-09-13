import Icon from "@/src/lib/IonIcons";
import { Tabs } from "expo-router";

export default function DashboardLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Icon name="House" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="Transactions"
        options={{
          tabBarIcon: ({ color }) => <Icon name="ArrowLeftRight" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="AddTransaction"
        options={{
          title: "New Transaction",
          tabBarIcon: ({ color }) => <Icon name="ListPlus" color={color} size={24} />,
          unmountOnBlur: true,
        }}
      />
      <Tabs.Screen
        name="Summary"
        options={{
          tabBarIcon: ({ color }) => <Icon name="Group" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="Reminders"
        options={{
          tabBarIcon: ({ color }) => <Icon name="Clock10" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
