import { Stack } from "expo-router";

export default function AccountStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Upsert"
        options={({ route }: any) => ({
          title: route.params?.accountId ? "Edit Account" : "Add Account",
        })}
      />
      <Stack.Screen
        name="Categories/Upsert"
        options={({ route }: any) => ({
          title: route.params?.categoryId ? "Edit Accounts' Category" : "Add Accounts' Category",
        })}
      />
    </Stack>
  );
}
