import { SecondaryTabBar } from "@/src/components/ui";

export default function CategoriesLayout() {
  return (
    <SecondaryTabBar
      mode="router"
      routes={[
        { name: "Categories", path: "/Categories" },
        { name: "Groups", path: "/Categories/Groups" },
      ]}
    />
  );
}
