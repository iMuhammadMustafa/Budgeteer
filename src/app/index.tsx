import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, TouchableOpacity } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import { DevToolsBubble } from "react-native-react-query-devtools";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";

import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import Icon from "../lib/IonIcons";
import { useNotifications } from "../providers/NotificationsProvider";
import Notification from "../components/Notification";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";
import React from "react";

export default function Index() {
  // const { toggleColorScheme, colorScheme, setColorScheme } = useColorScheme();
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotifications();

  const { isDarkMode, toggleTheme } = useTheme();

  const { session } = useAuth();

  return (
    <SafeAreaView className="flex-col justify-center items-center w-full h-full">
      <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />

      <View>
        <Text className=" color-primary-100">Welcome! {session?.user.email}</Text>
        {notifications.length > 0 && <Text>{JSON.stringify(notifications)}</Text>}
      </View>

      <Notification />

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

        <Button
          variant="solid"
          className="p-2 my-1"
          action="primary"
          onPress={() => addNotification({ message: "Hello", type: "success" })}
        >
          <ButtonText>Add Notification</ButtonText>
        </Button>

        <Button
          variant="solid"
          className="p-2 my-1"
          action="primary"
          onPress={() => removeNotification(notifications[0].id)}
        >
          <ButtonText>Remove Notification</ButtonText>
        </Button>

        <Button variant="solid" className="p-2 my-1" action="primary" onPress={clearNotifications}>
          <ButtonText>Clear Notifications</ButtonText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
