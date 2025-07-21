import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { router } from "expo-router";

export default function Landing({ session }: { session?: any }) {
  return (
    <View className="flex-1 bg-background-100 justify-center items-center px-6">
      <View className="items-center mb-8">
        <Image source={require("@/assets/images/logo.png")} className="w-24 h-24 mb-4" resizeMode="contain" />
        <Text className="text-3xl font-extrabold text-primary mb-2">Budgeteer</Text>
        <Text className="text-base text-typography-700 text-center">
          Track your budget, manage accounts, and stay on top of your finances.
        </Text>
      </View>
      <View className="mb-8 w-full">
        <Text className="text-lg font-bold text-typography-900 mb-2">Features:</Text>
        <View className="space-y-2">
          <Text className="text-base text-typography-700">• Create accounts</Text>
          <Text className="text-base text-typography-700">• Track budgets & expenses</Text>
          <Text className="text-base text-typography-700">• Recurring transactions</Text>
          <Text className="text-base text-typography-700">• Compare previous expenses</Text>
          <Text className="text-base text-typography-700">• Set up and track budgets</Text>
        </View>
      </View>
      <Pressable
        className="bg-primary px-8 py-3 rounded-full shadow-hard-2"
        onPress={() => (session && session.user ? router.replace("/Dashboard") : router.replace("/Login"))}
      >
        <Text className="text-primary-foreground text-lg font-bold">
          {session && session.user ? "Go to Dashboard" : "Get Started"}
        </Text>
      </Pressable>
    </View>
  );
}
