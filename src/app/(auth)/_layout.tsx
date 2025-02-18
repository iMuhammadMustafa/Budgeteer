import { useAuth } from "@/src/providers/AuthProvider";
import { router, Stack } from "expo-router";
import { ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { session, isSessionLoading: loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }
  if (session) {
    router.push("/Dashboard");
  }

  return (
    <Stack>
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
    </Stack>
  );
}
