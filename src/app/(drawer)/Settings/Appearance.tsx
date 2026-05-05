import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { ScrollView, Text, View } from "react-native";
import ThemedSwitch from "@/src/components/elements/ThemedSwitch";

export default function Appearance() {
  const { theme, isDarkMode, toggleTheme, showGrid, setShowGrid } = useTheme();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Appearance</Text>
          <Text className="text-sm text-muted-foreground">
            Customize how Budgeteer looks and feels
          </Text>
        </View>

        {/* Settings Cards */}
        <View className="bg-card rounded-xl border border-muted overflow-hidden">
          {/* Theme Mode */}
          <Button
            variant="ghost"
            size="lg"
            hapticFeedback="selection"
            onPress={toggleTheme}
            className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
            testID="btn-toggle-theme"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <MyIcon name={isDarkMode ? "Moon" : "Sun"} size={20} className="text-primary" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-foreground">Theme Mode</Text>
              <Text className="text-sm text-muted-foreground">
                {isDarkMode ? "Dark mode is active" : "Light mode is active"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted-foreground uppercase font-medium">
                {theme}
              </Text>
              <ThemedSwitch
                value={isDarkMode}
                onValueChange={toggleTheme}
                testID="switch-theme"
              />
            </View>
          </Button>

          {/* Grid Background */}
          <Button
            variant="ghost"
            size="lg"
            hapticFeedback="selection"
            onPress={() => setShowGrid(!showGrid)}
            className="flex-row items-center p-4 active:bg-muted/50 rounded-none justify-start"
            testID="btn-toggle-grid"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <MyIcon name="Grid3X3" size={20} className="text-primary" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-medium text-foreground">Grid Background</Text>
              <Text className="text-sm text-muted-foreground">
                Show subtle grid pattern on backgrounds
              </Text>
            </View>
            <ThemedSwitch
              value={showGrid}
              onValueChange={setShowGrid}
              testID="switch-grid"
            />
          </Button>
        </View>

        {/* Preview hint */}
        <Text className="text-xs text-muted-foreground text-center mt-4">
          Changes are applied immediately and saved automatically
        </Text>
      </View>
    </ScrollView>
  );
}
