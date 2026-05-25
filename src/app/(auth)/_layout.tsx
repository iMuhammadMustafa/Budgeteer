import { useAuth } from "@/src/providers/AuthProvider";
import { router, Stack } from "expo-router";
import { ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (session) {
    router.navigate("/Dashboard");
  }

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
    </Stack>
  );
}
