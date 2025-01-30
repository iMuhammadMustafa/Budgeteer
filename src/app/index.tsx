import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  if (session?.user) {
    router.push("/Dashboard");
  } else {
    router.push("/Login");
  }
}
