import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MyIcon from "@/src/components/elements/MyIcon";
import { Button, ColorPicker, IconPicker, Input, SegmentedControl, Text } from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { AccountCategory, Inserts, Updates } from "@/src/types/database/Tables.Types";
import { commonValidationRules, createCategoryNameValidation } from "@/src/utils/form-validation";
import { mergeRecents, useRecentValues } from "@/src/hooks/useRecentValues";
import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";

export type AccountCategoryFormType = Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;

interface AccountCategoryFormProps {
  category: AccountCategoryFormType;
  onSuccess?: (savedCategory: any) => void;
  onCancel?: () => void;
}

interface AccountCategoryFormData {
  name: string;
  icon: string;
  color: string;
  displayorder: number;
  type: "Asset" | "Liability";
  id?: string;
  tenantid?: string;
  isdeleted?: boolean;
  createdby?: string;
  updatedby?: string;
}

export const initialState: AccountCategoryFormData = {
  name: "",
  icon: "Landmark",
  color: "info-100",
  displayorder: 0,
  type: "Asset",
};

const validationSchema: ValidationSchema<AccountCategoryFormData> = {
  name: createCategoryNameValidation(),
  type: [commonValidationRules.required("Account type is required")],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
};

function AccountCategoryFormComponent({ category, onSuccess }: AccountCategoryFormProps) {
  const { isDark } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const service = useAccountCategoryService();
  const { data: allCategories } = service.useFindAll();

  const iconRecents = useRecentValues("account-category:icon");
  const colorRecents = useRecentValues("account-category:color");
  const iconQuick = useMemo(
    () => mergeRecents(iconRecents.recent, (allCategories ?? []).map(c => c.icon)),
    [iconRecents.recent, allCategories],
  );
  const colorQuick = useMemo(
    () => mergeRecents(colorRecents.recent, (allCategories ?? []).map(c => c.color)),
    [colorRecents.recent, allCategories],
  );

  const [showAdvanced, setShowAdvanced] = useState(false);

  const initialFormData: AccountCategoryFormData = useMemo(
    () => ({
      name: category.name || "",
      icon: category.icon || "Landmark",
      color: category.color || "info-100",
      displayorder: category.displayorder ?? 0,
      type: (category.type as "Asset" | "Liability") || "Asset",
      ...(category.id && { id: category.id }),
      ...(category.tenantid && { tenantid: category.tenantid }),
      ...(category.isdeleted !== undefined && { isdeleted: category.isdeleted }),
      ...(category.createdby && { createdby: category.createdby }),
      ...(category.updatedby && { updatedby: category.updatedby }),
    }),
    [category],
  );

  const { formState, updateField, validateForm, isValid } = useFormState(initialFormData, validationSchema);
  const data = formState.data;

  const { mutate } = service.useUpsert();

  const handleSubmit = useCallback(
    async (submitData: AccountCategoryFormData) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          { form: submitData, original: category as AccountCategory },
          {
            onSuccess: savedData => {
              iconRecents.record(submitData.icon);
              colorRecents.record(submitData.color);
              if (onSuccess) onSuccess(savedData);
              else router.replace("/Accounts/Categories");
              resolve();
            },
            onError: reject,
          },
        );
      });
    },
    [mutate, category, onSuccess, iconRecents, colorRecents],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit);
  const onSubmit = useCallback(() => {
    if (validateForm()) submit(formState.data);
  }, [validateForm, submit, formState.data]);

  const swatch = data.color
    ? (swatchForHex(data.color, theme) ?? accentFor(data.name ?? "", theme))
    : accentFor(data.name ?? "", theme);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 p-1">
        {/* Preview */}
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={data.icon || "Landmark"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {data.name || "New category"}
            </Text>
            <Text className="text-caption uppercase text-ink-mute">{data.type}</Text>
          </View>
        </View>

        <Input
          label="Category name"
          placeholder="Enter category name"
          value={data.name ?? ""}
          onChangeText={value => updateField("name", value)}
          error={formState.touched.name ? formState.errors.name : undefined}
          testID="accountcategory-name"
        />

        <View>
          <Text variant="label" className="mb-[7px]">
            Type
          </Text>
          <SegmentedControl
            options={[
              { key: "Asset", label: "Asset", tone: "success" },
              { key: "Liability", label: "Liability", tone: "danger" },
            ]}
            value={data.type}
            onChange={key => updateField("type", key)}
            testID="accountcategory-type"
          />
        </View>

        <View>
          <Text variant="label" className="mb-[7px]">
            Icon
          </Text>
          <IconPicker
            variant="inline"
            value={data.icon}
            recent={iconQuick}
            color={swatch.fg}
            present="dialog"
            onChange={value => updateField("icon", value)}
            testID="accountcategory-icon"
          />
        </View>

        <View>
          <Text variant="label" className="mb-[7px]">
            Color
          </Text>
          <ColorPicker
            variant="inline"
            value={data.color}
            recent={colorQuick}
            present="dialog"
            onChange={value => updateField("color", value)}
            testID="accountcategory-color"
          />
        </View>

        <View className="rounded-xl border border-border bg-surface">
          <Pressable
            onPress={() => setShowAdvanced(s => !s)}
            accessibilityRole="button"
            className="flex-row items-center justify-between px-4 py-3.5 active:opacity-80"
          >
            <Text className="text-body text-ink">Advanced</Text>
            <MyIcon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={18} color={swatch.fg} />
          </Pressable>
          {showAdvanced ? (
            <View className="gap-4 px-4 pb-4">
              <Input
                label="Display order"
                keyboardType="number-pad"
                value={String(data.displayorder ?? 0)}
                onChangeText={value => updateField("displayorder", Number(value.replace(/[^0-9]/g, "")) || 0)}
                testID="accountcategory-order"
              />
            </View>
          ) : null}
        </View>

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">{error.message || "Failed to save category"}</Text>
          </View>
        ) : null}

        <Button
          label={data.id ? "Save Changes" : "Add Category"}
          onPress={onSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          leadingIcon="Check"
          testID="accountcategory-save"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const AccountCategoryForm = memo(AccountCategoryFormComponent);
export default AccountCategoryForm;
