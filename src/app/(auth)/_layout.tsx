import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { session, isSessionLoading: loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }
  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
    </Stack>
  );
}
