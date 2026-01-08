import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="ImportExport"
        options={{
          headerShown: true,
          title: "Import / Export",
          headerBackTitle: "Settings",
        }}
      />
    </Stack>
  );
}
