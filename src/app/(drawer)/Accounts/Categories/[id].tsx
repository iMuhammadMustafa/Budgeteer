import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import AccountCategoryForm from "@/src/components/forms/AccountCategoryForm";
import { Button, IconButton, ResponsiveModal, Text } from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import { TableNames } from "@/src/types/database/TableNames";
import { queryKeys } from "@/src/services/queryKeys";

export default function AccountCategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const { formatCurrency } = usePrimaryCurrency();
  const queryClient = useQueryClient();

  const categoryService = useAccountCategoryService();
  const accountService = useAccountService();

  const { data: category, isLoading } = categoryService.useFindById(id);
  const { data: accounts } = accountService.useFindAllWithCategory();

  const [editing, setEditing] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accountCategories.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  };

  const accountsInCategory = useMemo(
    () => (accounts ?? []).filter((a: any) => a.categoryid === id),
    [accounts, id],
  );
  const totalBalance = useMemo(
    () => accountsInCategory.reduce((sum, a: any) => sum + (Number(a.balance) || 0), 0),
    [accountsInCategory],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
        <Text variant="h3">Category not found</Text>
        <Button label="Back to Categories" variant="secondary" onPress={() => router.replace("/Accounts/Categories")} />
      </View>
    );
  }

  const swatch = category.color
    ? (swatchForHex(category.color, theme) ?? accentFor(category.name ?? "", theme))
    : accentFor(category.name ?? "", theme);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-3 p-5 w-full self-center"
      contentContainerStyle={{ maxWidth: 1180 }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push("/Accounts/Categories")}
          accessibilityRole="button"
          testID="accountcategory-back"
          className="flex-row items-center gap-1 py-1 active:opacity-70"
        >
          <MyIcon name="ChevronLeft" size={18} color={colors.inkMute} />
          <Text className="text-body text-ink-mute">Categories</Text>
        </Pressable>
        <IconButton
          icon="RefreshCw"
          variant="ghost"
          size="md"
          accessibilityLabel="Refresh"
          onPress={refresh}
          testID="accountcategory-refresh"
        />
      </View>

      <View className="rounded-xl border border-border bg-surface p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={category.icon || "Landmark"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {category.name}
            </Text>
            <Text className="text-caption uppercase text-ink-mute">{category.type}</Text>
          </View>
          <Button label="Edit" variant="secondary" size="sm" leadingIcon="SquarePen" onPress={() => setEditing(true)} />
        </View>

        <View className="my-4 h-px bg-border" />

        <Text className="text-caption uppercase tracking-wide text-ink-mute">Total balance</Text>
        <Text className="font-mono-semibold text-h1 text-ink">{formatCurrency(totalBalance, false)}</Text>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="h3">Accounts ({accountsInCategory.length})</Text>
      </View>

      {accountsInCategory.length === 0 ? (
        <View className="rounded-xl border border-border bg-surface p-6">
          <Text className="text-center text-ink-mute">No accounts in this category yet.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {accountsInCategory.map((a: any) => {
            const aswatch = a.color
              ? (swatchForHex(a.color, theme) ?? accentFor(a.name ?? "", theme))
              : accentFor(a.name ?? "", theme);
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/Accounts/${a.id}` as never)}
                accessibilityRole="button"
                testID={`accountcategory-account-${a.id}`}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 active:opacity-80"
              >
                <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: aswatch.soft }}>
                  <MyIcon name={a.icon || "Wallet"} size={16} color={aswatch.fg} />
                </View>
                <Text className="min-w-0 flex-1 text-body text-ink" numberOfLines={1}>
                  {a.name}
                </Text>
                <Text className="font-mono-semibold text-body text-ink">{formatCurrency(a.balance, false)}</Text>
                <MyIcon name="ChevronRight" size={16} color={colors.inkFaint} />
              </Pressable>
            );
          })}
        </View>
      )}

      <ResponsiveModal visible={editing} onClose={() => setEditing(false)} title="Edit Category" size="lg">
        <AccountCategoryForm category={category as any} onSuccess={() => setEditing(false)} />
      </ResponsiveModal>
    </ScrollView>
  );
}
