import MyIcon from "@/src/components/elements/MyIcon";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function SettingsIndex() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Settings</Text>
          <Text className="text-sm text-muted-foreground">
            Manage your app preferences and data
          </Text>
        </View>

        {/* Settings Options */}
        <View className="bg-card rounded-xl border border-muted overflow-hidden">
          {/* Import/Export */}
          <Pressable
            onPress={() => router.push("/Settings/ImportExport")}
            className="flex-row items-center p-4 border-b border-muted active:bg-muted/50"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <MyIcon name="ArrowUpDown" size={20} className="text-primary" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-foreground">Import / Export</Text>
              <Text className="text-sm text-muted-foreground">
                Transfer data between devices or storage modes
              </Text>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </Pressable>

          {/* Placeholder for future settings */}
          <View className="flex-row items-center p-4 opacity-50">
            <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
              <MyIcon name="Palette" size={20} className="text-muted-foreground" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-foreground">Appearance</Text>
              <Text className="text-sm text-muted-foreground">Coming soon</Text>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </View>

          <View className="flex-row items-center p-4 opacity-50">
            <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
              <MyIcon name="Bell" size={20} className="text-muted-foreground" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-foreground">Notifications</Text>
              <Text className="text-sm text-muted-foreground">Coming soon</Text>
            </View>
            <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
