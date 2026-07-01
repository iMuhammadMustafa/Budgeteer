import { View } from "react-native";
import { useRouter } from "expo-router";

import { useTheme } from "@/src/providers/ThemeProvider";
import { ListRow, Switch, Text as ThemedText } from "@/src/components/ui";
import PageLayout from "@/src/components/ui/pages/PageLayout";
import MyIcon from "@/src/components/elements/MyIcon";

export default function Appearance() {
  const { theme, isDarkMode, toggleTheme, showGrid, setShowGrid, colors } = useTheme();
  const router = useRouter();

  const chevron = <MyIcon name="ChevronRight" size={20} color={colors.inkFaint} />;

  return (
    <PageLayout title="Appearance" subtitle="Manage your app's appearance" backHref="/Settings">
      <ListRow
        iconName={isDarkMode ? "Moon" : "Sun"}
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        className="cursor-pointer"
        title="Theme Mode"
        subtitle={isDarkMode ? "Dark mode is active" : "Light mode is active"}
        right={
          <View className="flex-row items-center gap-2">
            <ThemedText variant="caption" className="uppercase text-ink-mute">
              {theme}
            </ThemedText>
            <Switch value={isDarkMode} onValueChange={toggleTheme} testID="switch-theme" />
          </View>
        }
        onPress={toggleTheme}
      />

      <ListRow
        iconName="Grid3x3"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Grid Background"
        subtitle="Show the subtle paper grid behind screens"
        right={<Switch value={showGrid} onValueChange={setShowGrid} testID="switch-grid" />}
        onPress={() => setShowGrid(!showGrid)}
        className="cursor-pointer"
      />

      <ListRow
        iconName="Palette"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Design System"
        subtitle="Preview the new tokens, fonts & colors"
        right={chevron}
        onPress={() => router.push("/design" as never)}
        testID="btn-open-design-system"
      />

      <ListRow
        iconName="Component"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Components"
        subtitle="Preview the new component primitives"
        right={chevron}
        onPress={() => router.push("/components" as never)}
        testID="btn-open-components"
      />

      <ThemedText variant="caption" className="mt-1 text-center text-ink-mute">
        Changes are applied immediately and saved automatically
      </ThemedText>
    </PageLayout>
  );
}
