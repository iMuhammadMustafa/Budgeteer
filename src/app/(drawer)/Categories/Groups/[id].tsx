import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import TransactionGroupForm from "@/src/components/forms/TransactionGroupForm";
import { Button, IconButton, ResponsiveModal, Text } from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";

export default function TransactionGroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();
  const queryClient = useQueryClient();

  const groupService = useTransactionGroupService();
  const categoryService = useTransactionCategoryService();

  const { data: group, isLoading } = groupService.useFindById(id);
  const { data: categories } = categoryService.useFindAll();

  const [editing, setEditing] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionGroups.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionCategories.all });
  };

  const categoriesInGroup = useMemo(
    () => (categories ?? []).filter(c => c.groupid === id),
    [categories, id],
  );
  const totalBudget = useMemo(
    () => categoriesInGroup.reduce((sum, c) => sum + (Number(c.budgetamount) || 0), 0),
    [categoriesInGroup],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
        <Text variant="h3">Group not found</Text>
        <Button label="Back to Groups" variant="secondary" onPress={() => router.replace("/Categories/Groups")} />
      </View>
    );
  }

  const swatch = group.color
    ? (swatchForHex(group.color, theme) ?? accentFor(group.name ?? "", theme))
    : accentFor(group.name ?? "", theme);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-3 p-5 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/Categories/Groups")}
          accessibilityRole="button"
          testID="group-back"
          className="flex-row items-center gap-1 py-1 active:opacity-70"
        >
          <MyIcon name="ChevronLeft" size={18} color={colors.inkMute} />
          <Text className="text-body text-ink-mute">Groups</Text>
        </Pressable>
        <IconButton
          icon="RefreshCw"
          variant="ghost"
          size="md"
          accessibilityLabel="Refresh"
          onPress={refresh}
          testID="group-refresh"
        />
      </View>

      <View className="rounded-xl border border-border bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={group.icon || "Shapes"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {group.name}
            </Text>
            <Text className="text-caption uppercase text-ink-mute">{group.type}</Text>
          </View>
          <Button label="Edit" variant="secondary" size="sm" leadingIcon="SquarePen" onPress={() => setEditing(true)} />
        </View>

        <View className="my-4 h-px bg-border" />

        <Text className="text-caption uppercase tracking-wide text-ink-mute">Total budget</Text>
        <Text className="font-mono-semibold text-h1 text-ink">{formatCurrency(totalBudget, false)}</Text>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="h3">Categories ({categoriesInGroup.length})</Text>
      </View>

      {categoriesInGroup.length === 0 ? (
        <View className="rounded-xl border border-border bg-surface p-6">
          <Text className="text-center text-ink-mute">No categories in this group yet.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {categoriesInGroup.map(c => {
            const cswatch = c.color
              ? (swatchForHex(c.color, theme) ?? accentFor(c.name ?? "", theme))
              : accentFor(c.name ?? "", theme);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/Categories/${c.id}` as never)}
                accessibilityRole="button"
                testID={`group-category-${c.id}`}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 active:opacity-80"
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: cswatch.soft }}>
                  <MyIcon name={c.icon || "Tag"} size={16} color={cswatch.fg} />
                </View>
                <Text className="min-w-0 flex-1 text-body text-ink" numberOfLines={1}>
                  {c.name}
                </Text>
                {c.budgetamount ? (
                  <Text className="font-mono-semibold text-body text-ink">{formatCurrency(c.budgetamount, false)}</Text>
                ) : null}
                <MyIcon name="ChevronRight" size={16} color={colors.inkFaint} />
              </Pressable>
            );
          })}
        </View>
      )}

      <ResponsiveModal visible={editing} onClose={() => setEditing(false)} title="Edit Group" size="lg">
        <TransactionGroupForm group={group as any} onSuccess={() => setEditing(false)} />
      </ResponsiveModal>
    </ScrollView>
  );
}
