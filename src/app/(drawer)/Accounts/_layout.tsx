import { SecondaryTabBar } from "@/src/components/ui";

export default function AccountsLayout() {
  return (
    <SecondaryTabBar
      mode="router"
      routes={[
        { name: "Accounts", path: "/Accounts" },
        { name: "Categories", path: "/Accounts/Categories" },
      ]}
    />
  );
}
