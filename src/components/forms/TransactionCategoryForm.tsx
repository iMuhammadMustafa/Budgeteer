import { memo, useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/providers/ThemeProvider";
import { TransactionCategoryFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionCategory, Updates } from "@/src/types/database/Tables.Types";
import { getCurrencySymbol } from "@/src/utils/currency";
import {
  commonValidationRules,
  createCategoryNameValidation,
  createDescriptionValidation,
} from "@/src/utils/form-validation";
import {
  Button,
  ColorPicker,
  IconPicker,
  Input,
  QuickPills,
  ResponsiveModal,
  SegmentedControl,
  Select,
  Text,
} from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import MyIcon from "@/src/components/elements/MyIcon";
import { mergeRecents, useRecentValues } from "@/src/hooks/useRecentValues";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";
import TransactionGroupForm, { initialState as transactionGroupInitialState } from "./TransactionGroupForm";

export type TransactionCategoryFormType =
  | Inserts<TableNames.TransactionCategories>
  | Updates<TableNames.TransactionCategories>;

export const initialState: TransactionCategoryFormData = {
  name: "",
  description: "",
  budgetamount: 0,
  budgetfrequency: "",
  icon: "Tag",
  color: "info-100",
  displayorder: 0,
  groupid: "",
  createdby: "",
  updatedby: "",
  isdeleted: false,
  tenantid: "",
  type: "Expense",
};

const FREQUENCY_OPTIONS = [
  { id: "Daily", label: "Daily", value: "Daily" },
  { id: "Weekly", label: "Weekly", value: "Weekly" },
  { id: "Monthly", label: "Monthly", value: "Monthly" },
  { id: "Yearly", label: "Yearly", value: "Yearly" },
];

const validationSchema: ValidationSchema<TransactionCategoryFormData> = {
  name: createCategoryNameValidation(),
  groupid: [commonValidationRules.required("Transaction group is required")],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
  budgetamount: [
    commonValidationRules.min(0, "Budget amount must be 0 or greater"),
    commonValidationRules.max(999999999.99, "Budget amount is too large"),
  ],
  budgetfrequency: [
    commonValidationRules.custom((value, formData) => {
      if (formData?.budgetamount && formData.budgetamount > 0) {
        return !!value && value.trim().length > 0;
      }
      return true;
    }, "Budget frequency is required when budget amount is greater than 0"),
  ],
  description: createDescriptionValidation(false),
};

interface TransactionCategoryFormProps {
  category: TransactionCategoryFormType;
  onSuccess?: (savedCategory: any) => void;
  onCancel?: () => void;
}

function sanitizeNumeric(raw: string) {
  let s = raw.replace(/[^0-9.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  return s;
}

function TransactionCategoryFormComponent({ category, onSuccess }: TransactionCategoryFormProps) {
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const service = useTransactionCategoryService();
  const groupService = useTransactionGroupService();
  const { data: allCategories } = service.useFindAll();
  const { data: groups, isLoading: isGroupsLoading } = groupService.useFindAll();
  const { primaryCurrency } = usePrimaryCurrency();

  const iconRecents = useRecentValues("transaction-category:icon");
  const colorRecents = useRecentValues("transaction-category:color");
  const groupRecents = useRecentValues("transaction-category:groupid");
  const iconQuick = useMemo(
    () =>
      mergeRecents(
        iconRecents.recent,
        (allCategories ?? []).map(c => c.icon),
      ),
    [iconRecents.recent, allCategories],
  );
  const colorQuick = useMemo(
    () =>
      mergeRecents(
        colorRecents.recent,
        (allCategories ?? []).map(c => c.color),
      ),
    [colorRecents.recent, allCategories],
  );
  const groupQuick = useMemo(
    () =>
      mergeRecents(
        groupRecents.recent,
        (allCategories ?? []).map(c => c.groupid),
      ),
    [groupRecents.recent, allCategories],
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);

  const initialFormData: TransactionCategoryFormData = useMemo(() => ({ ...initialState, ...category }), [category]);
  const { formState, updateField, validateForm, isValid } = useFormState(initialFormData, validationSchema);
  const data = formState.data;

  const { mutate } = service.useUpsert();

  const handleSubmit = useCallback(
    async (submitData: TransactionCategoryFormData) => {
      await new Promise<void>((resolve, reject) => {
        submitData.group = undefined;
        mutate(
          { form: submitData, original: category as TransactionCategory },
          {
            onSuccess: savedData => {
              iconRecents.record(submitData.icon);
              colorRecents.record(submitData.color);
              groupRecents.record(submitData.groupid);
              if (onSuccess) onSuccess(savedData);
              else router.replace("/Categories");
              resolve();
            },
            onError: reject,
          },
        );
      });
    },
    [mutate, category, onSuccess, iconRecents, colorRecents, groupRecents],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit);
  const onSubmit = useCallback(() => {
    if (validateForm()) submit(formState.data);
  }, [validateForm, submit, formState.data]);

  const groupOptions = useMemo(
    () => groups?.map(g => ({ value: g.id, label: g.name, icon: g.icon, color: g.color, group: g.type })) ?? [],
    [groups],
  );
  const selectedGroup = useMemo(() => groups?.find(g => g.id === data.groupid), [groups, data.groupid]);

  const swatch = data.color
    ? (swatchForHex(data.color, theme) ?? accentFor(data.name ?? "", theme))
    : accentFor(data.name ?? "", theme);
  const budgetString = data.budgetamount === null || data.budgetamount === undefined ? "" : String(data.budgetamount);

  if (isGroupsLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-ink-mute">Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 p-1">
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={data.icon || "Tag"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {data.name || "New category"}
            </Text>
            {selectedGroup ? (
              <Text className="text-caption uppercase text-ink-mute" numberOfLines={1}>
                {selectedGroup.name}
              </Text>
            ) : null}
          </View>
        </View>

        <Input
          label="Category name"
          placeholder="Enter category name"
          value={data.name ?? ""}
          onChangeText={value => updateField("name", value)}
          error={formState.touched.name ? formState.errors.name : undefined}
          testID="transactioncategory-name"
        />

        <QuickPills
          label="Transaction group"
          value={data.groupid || null}
          onChange={value => updateField("groupid", value)}
          options={groupOptions}
          recent={groupQuick}
          present="dialog"
          viewAllTitle="Choose a group"
          onAddNew={() => setAddingGroup(true)}
          addNewLabel="Add group"
          error={formState.touched.groupid ? formState.errors.groupid : undefined}
          testID="transactioncategory-group"
        />

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
            testID="transactioncategory-icon"
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
            testID="transactioncategory-color"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text variant="label" className="mb-[7px]">
              Budget
            </Text>
            <View className="flex-row items-center rounded-lg border border-border bg-surface px-3 py-3">
              <Text className="mr-2 font-mono text-body text-ink-mute">{getCurrencySymbol(primaryCurrency)}</Text>
              <TextInput
                value={budgetString}
                onChangeText={value => updateField("budgetamount", Number(sanitizeNumeric(value)) || 0)}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.inkFaint}
                selectionColor={colors.primary}
                className="min-w-0 flex-1 p-0 font-mono text-body text-ink"
                style={Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : undefined}
                testID="transactioncategory-budget"
              />
            </View>
          </View>
          <View className="flex-1">
            <Select
              label="Frequency"
              options={FREQUENCY_OPTIONS}
              value={data.budgetfrequency || null}
              onChange={value => updateField("budgetfrequency", (value as string) ?? "")}
              present="dialog"
              error={formState.touched.budgetfrequency ? formState.errors.budgetfrequency : undefined}
              testID="transactioncategory-frequency"
            />
          </View>
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
              <View>
                <Text variant="label" className="mb-[7px]">
                  Type
                </Text>
                <SegmentedControl
                  options={[
                    { key: "Income", label: "Income", tone: "success" },
                    { key: "Expense", label: "Expense", tone: "danger" },
                  ]}
                  value={data.type ?? "Expense"}
                  onChange={key => updateField("type", key)}
                  testID="transactioncategory-txtype"
                />
              </View>
              <Input
                label="Description"
                placeholder="Optional description"
                multiline
                value={data.description ?? ""}
                onChangeText={value => updateField("description", value)}
                testID="transactioncategory-description"
              />
              <Input
                label="Display order"
                keyboardType="number-pad"
                value={String(data.displayorder ?? 0)}
                onChangeText={value => updateField("displayorder", Number(value.replace(/[^0-9]/g, "")) || 0)}
                testID="transactioncategory-order"
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
          testID="transactioncategory-save"
        />
      </ScrollView>

      <ResponsiveModal visible={addingGroup} onClose={() => setAddingGroup(false)} title="Add Group" size="lg">
        <TransactionGroupForm
          group={transactionGroupInitialState}
          onSuccess={(saved: any) => {
            if (saved?.id) updateField("groupid", saved.id);
            setAddingGroup(false);
          }}
          onCancel={() => setAddingGroup(false)}
        />
      </ResponsiveModal>
    </SafeAreaView>
  );
}

const TransactionCategoryForm = memo(TransactionCategoryFormComponent);
export default TransactionCategoryForm;
