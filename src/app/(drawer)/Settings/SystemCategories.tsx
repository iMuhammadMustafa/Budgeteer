import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { ListRow, ResponsiveModal, Text as ThemedText } from "@/src/components/ui";
import PageLayout from "@/src/components/ui/pages/PageLayout";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useConfigurationService } from "@/src/services/Configurations.Service";
import { SYSTEM_CATEGORY_DEFS, SystemCategoryDef } from "@/src/services/helpers/systemCategories";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { ConfigurationTypes } from "@/src/types/database/Config.Types";
import { TableNames } from "@/src/types/database/TableNames";
import { TransactionCategory } from "@/src/types/database/Tables.Types";

export default function SystemCategoriesSettings() {
  const categoryService = useTransactionCategoryService();
  const { data: categories, isLoading } = categoryService.useFindAll();

  const [activeDef, setActiveDef] = useState<SystemCategoryDef | null>(null);

  return (
    <PageLayout
      title="System Categories"
      subtitle="These categories power account operations. Remap them to a category of your choice."
      backHref="/Settings"
    >
      {SYSTEM_CATEGORY_DEFS.map(def => (
        <SystemCategoryRow
          key={def.configType}
          def={def}
          categories={categories}
          onPress={() => setActiveDef(def)}
        />
      ))}

      <CategoryPickerModal
        def={activeDef}
        categories={categories}
        isLoading={isLoading}
        onClose={() => setActiveDef(null)}
      />
    </PageLayout>
  );
}

function SystemCategoryRow({
  def,
  categories,
  onPress,
}: {
  def: SystemCategoryDef;
  categories?: TransactionCategory[];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const configService = useConfigurationService();
  const { data: config } = configService.useGetConfiguration(
    TableNames.TransactionCategories,
    def.configType,
    "id",
  );

  const mapped = useMemo(
    () => categories?.find(c => c.id === config?.value),
    [categories, config?.value],
  );

  const currentLabel = mapped?.name ?? "Not set — using default";

  return (
    <ListRow
      iconName={mapped?.icon || "Wallet"}
      iconShape="circle"
      iconColor={colors.primary}
      iconBg={colors.primarySoft}
      title={def.label}
      subtitle={def.description}
      right={
        <View className="flex-row items-center gap-2">
          <ThemedText variant="caption" className="text-ink-mute" numberOfLines={1}>
            {currentLabel}
          </ThemedText>
          <MyIcon name="ChevronRight" size={20} color={colors.inkFaint} />
        </View>
      }
      onPress={onPress}
      testID={`btn-system-category-${def.configType}`}
    />
  );
}

function CategoryPickerModal({
  def,
  categories,
  isLoading,
  onClose,
}: {
  def: SystemCategoryDef | null;
  categories?: TransactionCategory[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const configService = useConfigurationService();
  const setSystemCategory = configService.useSetSystemCategory();
  const { data: config } = configService.useGetConfiguration(
    TableNames.TransactionCategories,
    def?.configType ?? ("" as ConfigurationTypes),
    "id",
  );

  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSelect = async (categoryId: string) => {
    if (!def || setSystemCategory.isPending) return;
    setPendingId(categoryId);
    try {
      await setSystemCategory.mutateAsync({ configType: def.configType, categoryId });
      onClose();
    } finally {
      setPendingId(null);
    }
  };

  const sorted = useMemo(
    () => [...(categories ?? [])].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    [categories],
  );

  return (
    <ResponsiveModal visible={!!def} onClose={onClose} title={`Map "${def?.label ?? ""}"`} size="lg">
      {isLoading ? (
        <View className="items-center p-6">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView className="max-h-[420px]" contentContainerClassName="gap-2 p-1">
          {sorted.map(c => {
            const isSelected = c.id === config?.value;
            const isPending = pendingId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => handleSelect(c.id)}
                className="flex-row items-center rounded-xl border border-border bg-surface px-[15px] py-[13px] active:opacity-90"
                testID={`btn-system-category-option-${c.id}`}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <MyIcon name={c.icon || "Tag"} size={18} color={colors.primary} />
                </View>
                <View className="ml-[13px] flex-1">
                  <ThemedText variant="label" numberOfLines={1}>
                    {c.name}
                  </ThemedText>
                  <ThemedText variant="caption" className="text-ink-mute">
                    {c.type}
                  </ThemedText>
                </View>
                {isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : isSelected ? (
                  <MyIcon name="Check" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
          {sorted.length === 0 && (
            <View className="items-center p-4">
              <ThemedText variant="caption">No categories available.</ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </ResponsiveModal>
  );
}
