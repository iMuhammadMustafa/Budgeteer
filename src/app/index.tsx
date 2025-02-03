import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";

export default function RootIndex() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  if (session?.user) {
    router.push("/Dashboard");
  } else {
    router.push("/Login");
  }
}
