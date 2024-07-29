import { Redirect, router } from "expo-router";
import { SafeAreaView, Text, View, Image, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";

export default function Index() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href="/Home" />;
  }

  return (
    <SafeAreaView className={`bg-background h-full`}>
      <TouchableOpacity onPress={() => router.push("/Home")}>
        <Text className={`text-primary font-psemibold text-lg`}>Go to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Login")}>
        <Text className={`text-primary font-psemibold text-lg`}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/Register")}>
        <Text className={`text-primary font-psemibold text-lg`}>Register</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
