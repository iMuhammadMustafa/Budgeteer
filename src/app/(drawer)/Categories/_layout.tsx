import TabNavigation from "@/src/components/TabNavigation";
import { useSegments } from "expo-router";

export default function CategoriesLayout() {
  const segments = useSegments();

  return (
    <TabNavigation
      routes={[
        { name: "Categories", path: "/Categories" },
        { name: "Groups", path: "/Categories/Groups" },
      ]}
      currentRoute={segments[2] === "Groups" ? "/Categories/Groups" : "/Categories"}
    />
  );
}
