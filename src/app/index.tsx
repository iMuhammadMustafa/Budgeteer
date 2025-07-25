import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import Landing from "@/src/components/pages/Landing";
import BudgeteerLanding from "@/src/components/pages/VLanding";
export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="flex-1 bg-background-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center">
          {/* Landing Page */}
          {/* <Landing session={session} /> */}
          <BudgeteerLanding session={session} router={router} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
