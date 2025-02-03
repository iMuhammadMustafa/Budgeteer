import { Tabs } from "expo-router";
import MyIcon from "@/src/utils/Icons.Helper";

export default function DashboardLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {DashboardTab}
      {TransactionsTab}
      {RemindersTab}
      {SummaryTab}
    </Tabs>
  );
}

const DashboardTab = (
  <Tabs.Screen
    name="Dashboard/index"
    options={{
      title: "Dashboard",
      tabBarIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
    }}
  />
);
const TransactionsTab = (
  <Tabs.Screen
    name="Transactions/index"
    options={{
      title: "Transactions",
      tabBarIcon: ({ color }) => <MyIcon name="House" color={color} size={24} />,
    }}
  />
);

const RemindersTab = (
  <Tabs.Screen
    name="Reminders/index"
    options={{
      title: "Reminders",
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

{
  /* <Tabs.Screen
        name="Dashboard/useDashboard"
        //hide element
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="Transactions"
        options={{
          tabBarIcon: ({ color }) => <MyIcon name="ArrowLeftRight" color={color} size={24} />,
        }}
      /> */
}
{
  /* 
      <Tabs.Screen
        name="AddTransaction"
        options={{
          title: "New Transaction",
          tabBarIcon: ({ color }) => <MyIcon name="ListPlus" color={color} size={24} />,
          unmountOnBlur: true,
        }}
      />
      <Tabs.Screen
        name="Summary"
        options={{
          tabBarIcon: ({ color }) => <MyIcon name="Group" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="Reminders"
        options={{
          tabBarIcon: ({ color }) => <MyIcon name="Clock10" color={color} size={24} />,
        }}
      /> */
}
