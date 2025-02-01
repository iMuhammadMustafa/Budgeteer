import { Text, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

export default function Index() {
  const { theme, toggleTheme } = useTheme();
  return (
    <View className="flex flex-col items-center justify-center h-full">
      <Text className="text-4xl text-center text-foreground" onPress={() => toggleTheme()}>
        Welcome to Expo Router
      </Text>
    </View>
  );
}
