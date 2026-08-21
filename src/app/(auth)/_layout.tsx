import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/providers/AuthProvider";
import { Loader } from "@/src/components/ui";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <Loader size="full" label="Loading…" />;
  }
  if (session) return <Redirect href="/Dashboard" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
    </Stack>
  );
}
