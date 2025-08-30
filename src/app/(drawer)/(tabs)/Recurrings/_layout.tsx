import { Stack } from "expo-router";

export default function RecurringsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Upsert"
        options={({ route }: any) => ({
          title: route.params?.id ? "Edit Recurring Transaction" : "Create Recurring Transaction",
        })}
      />
    </Stack>
  );
}
