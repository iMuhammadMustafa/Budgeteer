import Button from "@/src/components/elements/Button";
import ThemedText from "@/src/components/elements/ThemedText";
import { router, Stack } from "expo-router";
import { View } from "react-native";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="ImportExport"
        options={{
          headerShown: true,
          header: () => (
            <View className="px-4">
              <Button
                variant="ghost"
                size="icon"
                onPress={() => router.replace("/Settings")}
                leftIcon="ArrowLeft"
                label="Import / Export"
                className="self-start"
                textClasses="text-lg"
              />
              <ThemedText variant="caption" className="text-sm text-muted-foreground m-2">
                Transfer your data between devices or storage modes, or export for backup and analysis.
              </ThemedText>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="Appearance"
        options={{
          headerShown: true,
          header: () => (
            <View className="px-4">
              <Button
                variant="ghost"
                size="icon"
                onPress={() => router.replace("/Settings")}
                leftIcon="ArrowLeft"
                label="Appearance"
                className="self-start"
                textClasses="text-lg"
              />
              <ThemedText variant="caption" className="text-sm text-muted-foreground m-2">
                Customize how Budgeteer looks and feels
              </ThemedText>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="Currency"
        options={{
          headerShown: true,
          header: () => (
            <View className="px-4">
              <Button
                variant="ghost"
                size="icon"
                onPress={() => router.replace("/Settings")}
                leftIcon="ArrowLeft"
                label="Currency"
                className="self-start"
                textClasses="text-lg"
              />
              <ThemedText variant="caption" className="text-sm text-muted-foreground m-2">
                Set your primary currency for all transactions
              </ThemedText>
            </View>
          ),
        }}
      />
    </Stack>
  );
}
