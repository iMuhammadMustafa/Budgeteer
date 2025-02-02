import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import MyIcon from "@/src/utils/Icons.Helper";
import { Redirect } from "expo-router";

export default function Index() {
  const { theme, toggleTheme } = useTheme();

  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  if (!session) return <Redirect href="/Login" />;

  return (
    <View className="flex flex-col items-center justify-center h-full">
      <Text className="text-4xl text-center text-foreground" onPress={() => toggleTheme()}>
        Welcome to Expo Router
      </Text>
      <MyIcon name="AlarmClock" size={50} className="text-warning-100" />
    </View>
  );
}
