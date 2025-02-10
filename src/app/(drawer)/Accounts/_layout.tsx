import { Stack } from "expo-router";

export default function AccountStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="Upsert" options={{ headerShown: true }} />
    </Stack>
  );
}
