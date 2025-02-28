import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="justify-center items-center w-full">
      <ScrollView>
        <View>
          <Text className="color-primary-100">Welcome! {session?.user.email}</Text>
        </View>
        {!session || !session?.user ? (
          <Pressable className="p-2 my-1 bg-primary" onPress={() => router.replace("/Login")}>
            <Text className="text-primary-foreground">Login!</Text>
          </Pressable>
        ) : (
          <Pressable className="p-2 my-1 bg-primary" onPress={() => router.replace("/Dashboard")}>
            <Text className="text-primary-foreground">Dashboard!</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
