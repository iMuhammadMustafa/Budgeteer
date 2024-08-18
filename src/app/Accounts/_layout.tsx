import { Stack } from "expo-router";

export default function AccountsLayout() {
  return (
    <Stack>
      <Stack.Screen name="Create/[accountId]" options={{ headerShown: false }} />
    </Stack>
  );
}
