import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";

export default function SettingsIndex() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <ThemedText variant="heading" className="text-2xl mb-2">Settings</ThemedText>
          <ThemedText variant="caption" className="text-sm text-muted-foreground">
            Manage your app preferences and data
          </ThemedText>
        </View>

        {/* Settings Options */}
        <View className="bg-card rounded-xl border border-muted overflow-hidden">
          {/* Import/Export */}
          <Button
            variant="ghost"
            size="lg"
            onPress={() => router.push("/Settings/ImportExport")}
            className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
            testID="btn-settings-import-export"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <MyIcon name="ArrowUpDown" size={20} className="text-primary" />
            </View>
            <View className="ml-3 flex-1">
              <ThemedText variant="label" className="text-base">Import / Export</ThemedText>
              <ThemedText variant="caption" className="text-sm text-muted-foreground">
                Transfer data between devices or storage modes
              </ThemedText>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </Button>

          {/* Appearance */}
          <Button
            variant="ghost"
            size="lg"
            onPress={() => router.push("/Settings/Appearance")}
            className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
            testID="btn-settings-appearance"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <MyIcon name="Palette" size={20} className="text-primary" />
            </View>
            <View className="ml-3 flex-1">
              <ThemedText variant="label" className="text-base">Appearance</ThemedText>
              <ThemedText variant="caption" className="text-sm text-muted-foreground">Theme, grid background & more</ThemedText>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </Button>

          <View className="flex-row items-center p-4 opacity-50">
            <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
              <MyIcon name="Bell" size={20} className="text-muted-foreground" />
            </View>
            <View className="ml-3 flex-1">
              <ThemedText variant="label" className="text-base">Notifications</ThemedText>
              <ThemedText variant="caption" className="text-sm text-muted-foreground">Coming soon</ThemedText>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
