import { View } from "react-native";
import { router } from "expo-router";

import { useTheme } from "@/src/providers/ThemeProvider";
import { ListRow, Text as ThemedText } from "@/src/components/ui";
import PageLayout from "@/src/components/ui/pages/PageLayout";
import MyIcon from "@/src/components/elements/MyIcon";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

export default function SettingsIndex() {
  const { primaryCurrency } = usePrimaryCurrency();
  const { colors } = useTheme();

  const chevron = <MyIcon name="ChevronRight" size={20} color={colors.inkFaint} />;

  return (
    <PageLayout title="" subtitle="Manage your app preferences and data">
      <ListRow
        iconName="ArrowUpDown"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Import / Export"
        subtitle="Transfer data between devices or storage modes"
        right={chevron}
        onPress={() => router.push("/Settings/ImportExport")}
        testID="btn-settings-import-export"
        className="cursor-pointer"
      />

      <ListRow
        iconName="Palette"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Appearance"
        subtitle="Theme, grid background & more"
        right={chevron}
        onPress={() => router.push("/Settings/Appearance")}
        testID="btn-settings-appearance"
      />

      <ListRow
        iconName="DollarSign"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="Primary Currency"
        subtitle="Used for totals and as the default for new transactions"
        right={
          <View className="flex-row items-center gap-2">
            <ThemedText variant="caption" className="text-ink-mute">
              {primaryCurrency}
            </ThemedText>
            {chevron}
          </View>
        }
        onPress={() => router.push("/Settings/Currency")}
        testID="btn-settings-currency"
      />

      <ListRow
        iconName="Wallet"
        iconShape="circle"
        iconColor={colors.primary}
        iconBg={colors.primarySoft}
        title="System Categories"
        subtitle="Map the categories used for balance adjustments & transfers"
        right={chevron}
        onPress={() => router.push("/Settings/SystemCategories")}
        testID="btn-settings-system-categories"
      />

      <ListRow
        iconName="Bell"
        iconShape="circle"
        iconColor={colors.inkMute}
        iconBg={colors.surfaceAlt}
        title="Notifications"
        subtitle="Coming soon"
        right={chevron}
        className="opacity-50"
      />
    </PageLayout>
  );
}
