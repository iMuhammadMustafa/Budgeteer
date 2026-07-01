import { Button, Divider, Text as ThemedText } from "@/src/components/ui";
import MyIcon from "@/src/components/elements/MyIcon";
import { Linking, Text, View } from "react-native";

export default function ErrorStateComponent({ error, onRetry }: { error: Error; onRetry: () => void }) {
  // Format the error message or use a default one, since we don't know the exact error shape
  const errorMessage = error.message ? error.message.toUpperCase().replace(/\s+/g, "_") : "ERR_NETWORK_TIMEOUT";

  return (
    <View className="flex-1 items-center justify-center gap-4 p-5">
      <View className="p-5 rounded-full bg-danger-50 border border-danger-200 relative mb-2">
        <MyIcon name="CloudOff" size={45} className="text-danger-700" />
      </View>

      <ThemedText variant="h3" className="text-xl font-semibold text-center">
        Couldn't load transactions
      </ThemedText>

      <ThemedText variant="caption" className="text-center px-10 text-base">
        Something went wrong while fetching{"\n"}your data. This is usually temporary.
      </ThemedText>

      <View className="bg-surface rounded-xl border border-outline-200 px-4 py-2 mt-2">
        <Text className="text-xs font-mono text-muted-foreground">ERROR {errorMessage} · 504</Text>
      </View>

      <View className="flex-row gap-3 mt-2">
        <Button variant="outline" label="Try again" leadingIcon="RotateCcw" iconSize={16} onPress={onRetry} />
        <Button
          variant="outline"
          label="Get help"
          trailingIcon="ArrowUpRight"
          iconSize={16}
          onPress={() => {
            Linking.openURL("mailto:support@budgeteer.com");
          }}
        />
      </View>

      <Divider className="w-full max-w-[300px] mt-6 mb-2" />

      <View className="flex-row items-start px-2">
        <MyIcon name="Info" size={16} className="text-muted-foreground mr-2 mt-[2px]" />
        <ThemedText variant="caption" className="flex-1 text-sm">
          If this keeps happening,{" "}
          <Text className="text-primary" onPress={() => {}}>
            check your connection
          </Text>{" "}
          or{" "}
          <Text className="text-primary" onPress={() => Linking.openURL("mailto:support@budgeteer.com")}>
            contact support
          </Text>
          .
        </ThemedText>
      </View>
    </View>
  );
}
