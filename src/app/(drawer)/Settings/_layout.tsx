import { Stack } from "expo-router";

export default function SettingsStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
