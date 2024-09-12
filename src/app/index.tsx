import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, ScrollView, LogBox, Pressable } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";

import { Button, ButtonText } from "@/components/ui/button";
import Icon from "../lib/IonIcons";
import { useNotifications } from "../providers/NotificationsProvider";

export default function Index() {
  // const { toggleColorScheme, colorScheme, setColorScheme } = useColorScheme();
  const { isDarkMode, toggleTheme } = useTheme();

  const { session } = useAuth();

  LogBox.ignoreLogs(["Require cycle: node_modules/"]);

  return (
    <SafeAreaView className="w-full ">
      <ScrollView>
        <View className="justify-center items-center">
          <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />
          <View>
            <Text className="color-primary-100">Welcome! {session?.user.email}</Text>
            <Pressable className="p-2 my-1 bg-primary-0" onPress={toggleTheme}>
              <Icon name={isDarkMode ? "Moon" : "Sun"} className=" text-background-light dark:text-background-dark" />
            </Pressable>
          </View>

          {session?.user ? (
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Dashboard")}>
              <ButtonText>Dashboard!</ButtonText>
            </Button>
          ) : (
            <>
              <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Login")}>
                <ButtonText>Login!</ButtonText>
              </Button>
              <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Accounts")}>
                <ButtonText>Register!</ButtonText>
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
