import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import MyIcon from "@/src/utils/Icons.Helper";

interface DemoModeIndicatorProps {
  variant?: "banner" | "badge" | "header";
  className?: string;
}

export default function DemoModeIndicator({ variant = "banner", className = "" }: DemoModeIndicatorProps) {
  const { isDemoLoaded } = useAuth();

  if (!isDemoLoaded) {
    return null;
  }

  switch (variant) {
    case "banner":
      return (
        <View className={`bg-yellow-400 dark:bg-yellow-500 p-3 mx-4 my-2 rounded-lg flex-row items-center justify-center ${className}`}>
          <MyIcon name="Beaker" size={20} color="#000" />
          <Text className="text-black font-bold ml-2 text-center">
            Demo Mode - Exploring with sample data
          </Text>
        </View>
      );

    case "badge":
      return (
        <View className={`bg-yellow-400 dark:bg-yellow-500 px-2 py-1 rounded-full flex-row items-center ${className}`}>
          <MyIcon name="Beaker" size={14} color="#000" />
          <Text className="text-black font-semibold ml-1 text-xs">DEMO</Text>
        </View>
      );

    case "header":
      return (
        <View className={`bg-yellow-400 dark:bg-yellow-500 px-3 py-1 rounded-md flex-row items-center ${className}`}>
          <MyIcon name="Beaker" size={16} color="#000" />
          <Text className="text-black font-semibold ml-1 text-sm">Demo Mode</Text>
        </View>
      );

    default:
      return null;
  }
}