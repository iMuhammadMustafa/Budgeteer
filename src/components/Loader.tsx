import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Loader() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-base text-foreground">Loading expense data...</Text>
      </View>
    </SafeAreaView>
  );
}
