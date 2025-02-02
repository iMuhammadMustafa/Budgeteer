import { Text, View } from "react-native";
import { useTheme } from "@/src/providers/ThemeProvider";
import Icon from "@/src/utils/Icons.Helper";

export default function Index() {
  const { theme, toggleTheme } = useTheme();
  return (
    <View className="flex flex-col items-center justify-center h-full">
      <Text className="text-4xl text-center text-foreground" onPress={() => toggleTheme()}>
        Welcome to Expo Router
      </Text>
      <Icon name="AlarmClock" size={50} className="text-warning-100" />
    </View>
  );
}
