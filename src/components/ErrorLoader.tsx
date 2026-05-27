import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "@/src/components/elements/Button";

export default function ErrorLoader({
  message,
  onRefresh,
  title,
}: {
  message: string;
  onRefresh: () => void;
  title?: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-bold text-status-danger mb-2">{title ?? "Failed to load data"}</Text>
        <Text className="text-sm text-muted-foreground text-center mb-4">{message}</Text>
        <Button
          variant="primary"
          size="md"
          hapticFeedback="error"
          onPress={onRefresh}
          label="Try Again"
          testID="btn-summary-retry"
        />
      </View>
    </SafeAreaView>
  );
}
