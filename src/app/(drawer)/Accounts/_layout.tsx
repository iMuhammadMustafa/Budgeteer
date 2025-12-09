import TabNavigation from "@/src/components/TabNavigation";
import { useSegments } from "expo-router";

export default function AccountsLayout() {
  const segments = useSegments();

  return (
    <TabNavigation 
      routes={[
        { name: "Accounts", path: "/Accounts" },
        { name: "Categories", path: "/Accounts/Categories" },
      ]}
      currentRoute={segments[2] === "Categories" ? "/Accounts/Categories" : "/Accounts"}
    />
  );
}
