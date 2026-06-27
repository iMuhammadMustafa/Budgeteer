import Button from "@/src/components/elements/Button";
import MyIcon from "@/src/components/elements/MyIcon";
import ThemedSwitch from "@/src/components/elements/ThemedSwitch";
import { Text as ThemedText } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

export default function Appearance() {
  const { theme, isDarkMode, toggleTheme, showGrid, setShowGrid } = useTheme();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card rounded-xl border border-muted overflow-hidden">
        <Button
          variant="ghost"
          hapticFeedback="selection"
          onPress={toggleTheme}
          className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
          testID="btn-toggle-theme"
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MyIcon name={isDarkMode ? "Moon" : "Sun"} size={20} className="text-primary" />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText variant="label">Theme Mode</ThemedText>
            <ThemedText variant="caption" className="text-sm text-muted-foreground">
              {isDarkMode ? "Dark mode is active" : "Light mode is active"}
            </ThemedText>
          </View>
          <View className="flex-row items-center gap-2">
            <ThemedText variant="caption" className="uppercase font-medium text-muted-foreground">
              {theme}
            </ThemedText>
            <ThemedSwitch value={isDarkMode} onValueChange={toggleTheme} testID="switch-theme" />
          </View>
        </Button>

        {/* Grid Background */}
        <Button
          variant="ghost"
          size="lg"
          hapticFeedback="selection"
          onPress={() => setShowGrid(!showGrid)}
          className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
          testID="btn-toggle-grid"
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MyIcon name="Grid3X3" size={20} className="text-primary" />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText variant="label">Grid Background</ThemedText>
            <ThemedText variant="caption" className="text-sm text-muted-foreground">
              Show the subtle paper grid behind screens
            </ThemedText>
          </View>
          <ThemedSwitch value={showGrid} onValueChange={setShowGrid} testID="switch-grid" />
        </Button>

        {/* Design System showcase (temporary entry point — remove once nav lands in Step 2) */}
        <Button
          variant="ghost"
          hapticFeedback="selection"
          onPress={() => router.push("/design" as never)}
          className="flex-row items-center p-4 border-b border-muted active:bg-muted/50 rounded-none justify-start"
          testID="btn-open-design-system"
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MyIcon name="Palette" size={20} className="text-primary" />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText variant="label">Design System</ThemedText>
            <ThemedText variant="caption" className="text-sm text-muted-foreground">
              Preview the new tokens, fonts & colors
            </ThemedText>
          </View>
          <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
        </Button>

        {/* Component preview (temporary entry point) */}
        <Button
          variant="ghost"
          hapticFeedback="selection"
          onPress={() => router.push("/components" as never)}
          className="flex-row items-center p-4 active:bg-muted/50 rounded-none justify-start"
          testID="btn-open-components"
        >
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MyIcon name="Component" size={20} className="text-primary" />
          </View>
          <View className="ml-3 flex-1">
            <ThemedText variant="label">Components</ThemedText>
            <ThemedText variant="caption" className="text-sm text-muted-foreground">
              Preview the new component primitives
            </ThemedText>
          </View>
          <MyIcon name="ChevronRight" size={20} className="text-muted-foreground" />
        </Button>
      </View>

      {/* Preview hint */}
      <ThemedText variant="caption" className="text-center mt-4 text-muted-foreground">
        Changes are applied immediately and saved automatically
      </ThemedText>
    </ScrollView>
  );
}
