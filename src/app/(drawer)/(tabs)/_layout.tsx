import { Tabs } from "expo-router";
import MyIcon from "@/src/utils/Icons.Helper";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {DashboardTab}
      {TransactionsTab}
      {AddTransaction}
      {SummaryTab}
      {RecurringsTab}
    </Tabs>
  );
}

const DashboardTab = (
  <Tabs.Screen
    name="Dashboard"
    options={{
      title: "Dashboard",
      tabBarIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
    }}
  />
);
const TransactionsTab = (
  <Tabs.Screen
    name="Transactions"
    options={{
      title: "Transactions",
      tabBarIcon: ({ color }) => <MyIcon name="ArrowRightLeft" color={color} size={24} />,
    }}
  />
);
const AddTransaction = (
  <Tabs.Screen
    name="AddTransaction"
    options={{
      title: "New Transaction",
      tabBarIcon: ({ color }) => <MyIcon name="ListPlus" color={color} size={24} />,
    }}
  />
);

const RecurringsTab = (
  <Tabs.Screen
    name="Recurrings"
    options={{
      title: "Recurrings",
      tabBarIcon: ({ color }) => <MyIcon name="Clock10" color={color} size={24} />,
    }}
  />
);

const SummaryTab = (
  <Tabs.Screen
    name="Summary/index"
    options={{
      title: "Summary",
      tabBarIcon: ({ color }) => <MyIcon name="Group" color={color} size={24} />,
    }}
  />
);
