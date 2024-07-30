import { Redirect, router } from "expo-router";
import { SafeAreaView, Text, View, Image, TouchableOpacity, ScrollView, Appearance } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import { useColorScheme } from "../lib/cnHelper";

import cards from "@/assets/images/cards.png";

export default function Index() {
  const { toggleColorScheme, colorScheme, setColorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-col justify-center items-center">
      <Image source={cards} className="max-w-[380px] max-h-[380px]" resizeMode="contain" />

      <View>
        <Text className="text-foreground">Welcome!</Text>
      </View>
      <View className="mt-5 w-[35%]">
        <TouchableOpacity className="bg-primary rounded p-2 w-full my-1" onPress={() => router.push("/Login")}>
          <Text className="text-foreground font-psemibold text-lg text-center">Login</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-primary rounded p-2 w-full my-1" onPress={() => router.push("/Register")}>
          <Text className="text-foreground font-psemibold text-lg text-center">Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary rounded p-2 w-full my-1"
          onPress={() => {
            toggleColorScheme();
          }}
        >
          <Text className="text-foreground font-psemibold text-lg text-center">Change Theme</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
