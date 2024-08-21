import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Stack, useNavigation, useRootNavigation, useRouter, useSegments } from "expo-router";
import { Button, Text } from "react-native";

export default function CategoriesStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Upsert/[categoryId]"
        options={{
          title: "Upsert",
        }}
      />
    </Stack>
  );
}
