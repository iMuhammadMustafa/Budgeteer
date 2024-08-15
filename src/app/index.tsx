import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, TouchableOpacity } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";

import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import Icon from "../lib/IonIcons";

export default function Index() {
  // const { toggleColorScheme, colorScheme, setColorScheme } = useColorScheme();

  const { isDarkMode, toggleTheme } = useTheme();

  const { session } = useAuth();

  return (
    <SafeAreaView className="flex-col justify-center items-center w-full h-full bg-background-0">
      <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />

      <View>
        <Text className=" color-primary-100">Welcome! {session?.user.email}</Text>
      </View>

      <View className="mt-5 w-[35%] ">
        <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Login")}>
          <ButtonText>Login!</ButtonText>
        </Button>

        <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Accounts")}>
          <ButtonText>Register!</ButtonText>
        </Button>

        <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Dashboard")}>
          <ButtonText>Dashboard!</ButtonText>
        </Button>

        <Button variant="solid" className="p-2 my-1" action="primary" onPress={toggleTheme}>
          <ButtonIcon as={Icon} name={isDarkMode ? "Moon" : "Sun"} />
        </Button>
      </View>
    </SafeAreaView>
  );
}
//size={24} color={isDarkMode ? "black" : "white"}
