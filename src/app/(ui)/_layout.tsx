import { Stack } from "expo-router";

import { GridBackground } from "@/src/components/ui";

export default function UILayout() {
  return (
    <>
      <GridBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="Design" />
        <Stack.Screen name="Components" />
      </Stack>
    </>
  );
}
