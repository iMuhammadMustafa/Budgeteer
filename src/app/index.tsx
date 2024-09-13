import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, LogBox, Pressable, ActivityIndicator } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";
import Icon from "../lib/IonIcons";
LogBox.ignoreLogs(["Require cycle: node_modules/"]);

import { Calendar, CalendarList, Agenda } from "react-native-calendars";
import React from "react";

export default function Index() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="justify-center items-center w-full">
      <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />

      <View>
        <Calendar
          markedDates={{
            "2024-09-16": { selected: true, marked: true, selectedColor: "blue" },
            "2024-09-17": { marked: true },
            "2024-09-18": { marked: true, dotColor: "red", activeOpacity: 0 },
            "2024-09-19": { disabled: true, disableTouchEvent: true },
          }}
        />
      </View>

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
    </SafeAreaView>
  );
}
