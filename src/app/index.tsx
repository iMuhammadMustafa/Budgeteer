import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, LogBox, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";
import Icon from "../lib/IonIcons";
LogBox.ignoreLogs(["Require cycle: node_modules/"]);

export default function Index() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="justify-center items-center w-full">
      <ScrollView>
        <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />

        <View>
          <Text className="color-primary-100">Welcome! {session?.user.email}</Text>
          <Pressable className="py-2 my-1 bg-primary items-center" onPress={toggleTheme}>
            <Icon name={isDarkMode ? "Moon" : "Sun"} className=" text-primary-foreground" />
          </Pressable>
        </View>

        {session?.user ? (
          <Pressable className="p-2 my-1 bg-primary" onPress={() => router.push("/Dashboard")}>
            <Text className="text-primary-foreground">Dashboard!</Text>
          </Pressable>
        ) : (
          <>
            <Pressable className="p-2 my-1 bg-primary" onPress={() => router.push("/Login")}>
              <Text className="text-primary-foreground">Login!</Text>
            </Pressable>
            <Pressable className="p-2 my-1 bg-primary" onPress={() => router.push("/Accounts")}>
              <Text className="text-primary-foreground">Register!</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
