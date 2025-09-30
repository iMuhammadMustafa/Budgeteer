import { router, Slot } from "expo-router";
import { View } from "react-native";
import Button from "./Button";

export default function TabNavigation({
  routes,
  currentRoute,
}: {
  routes: { name: string; path: string }[];
  currentRoute: string;
}) {
  return (
    <View className="flex-1">
      <View className="flex-row">
        {routes.map(route => (
          <Button
            key={route.name}
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${
              currentRoute === route.path ? "border-success" : "border-transparent"
            }`}
            onPress={() => router.replace(route.path as any)}
            label={route.name}
          />
        ))}
      </View>
      <View className="flex-1 py-2">
        <Slot />
      </View>
    </View>
  );
}
