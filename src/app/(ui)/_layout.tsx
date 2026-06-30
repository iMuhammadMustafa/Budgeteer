import { Stack } from "expo-router";

export default function UILayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Design" />
      <Stack.Screen name="Components" />
    </Stack>
  );
}
