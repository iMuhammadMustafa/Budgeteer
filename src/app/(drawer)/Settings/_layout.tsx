import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ImportExport" />
      <Stack.Screen name="Appearance" />
      <Stack.Screen name="Currency" />
      <Stack.Screen name="SystemCategories" />
    </Stack>
  );
}
