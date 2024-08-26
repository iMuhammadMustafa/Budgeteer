import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Stack, useNavigation, useRootNavigation, useRouter, useSegments } from "expo-router";
import { Button, Text } from "react-native";

export default function AccountCategoriesStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Upsert/[categoryid]"
        options={{
          title: "Upsert",
        }}
      />
    </Stack>
  );
}
