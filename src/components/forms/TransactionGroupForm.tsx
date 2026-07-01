import { memo, useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/providers/ThemeProvider";
import { TransactionGroupFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, TransactionGroup, Updates } from "@/src/types/database/Tables.Types";
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
  SegmentedControl,
  Select,
  Text,
} from "@/src/components/ui";
import { accentFor, swatchForHex, type ThemeName } from "@/src/components/ui/theme/tokens";
import MyIcon from "@/src/components/elements/MyIcon";
import { mergeRecents, useRecentValues } from "@/src/hooks/useRecentValues";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";

import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";

export type TransactionGroupFormType = Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;

export const initialState: TransactionGroupFormData = {
  name: "",
  type: "Expense",
  description: "",
  budgetamount: 0,
  budgetfrequency: "",
  icon: "Shapes",
  color: "info-100",
  displayorder: 0,
  createdby: "",
  updatedby: "",
  isdeleted: false,
  tenantid: "",
};

const TYPE_OPTIONS = [
  { value: "Income", label: "Income", tone: "success" },
  { value: "Expense", label: "Expense", tone: "danger" },
  { value: "Transfer", label: "Transfer", tone: "info" },
  // { value: "Adjustment", label: "Adjustment" },
  // { value: "Initial", label: "Initial" },
  // { value: "Refund", label: "Refund" },
];

const FREQUENCY_OPTIONS = [
  { id: "Daily", label: "Daily", value: "Daily" },
  { id: "Weekly", label: "Weekly", value: "Weekly" },
  { id: "Monthly", label: "Monthly", value: "Monthly" },
  { id: "Yearly", label: "Yearly", value: "Yearly" },
];

const validationSchema: ValidationSchema<TransactionGroupFormData> = {
  name: createCategoryNameValidation(),
  type: [commonValidationRules.required("Transaction type is required")],
  description: createDescriptionValidation(false),
  budgetamount: [
    commonValidationRules.min(0, "Budget amount must be 0 or greater"),
    commonValidationRules.max(999999999.99, "Budget amount is too large"),
  ],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
};

interface TransactionGroupFormProps {
  group: TransactionGroupFormType;
  onSuccess?: (savedGroup: any) => void;
  onCancel?: () => void;
}

function sanitizeNumeric(raw: string) {
  let s = raw.replace(/[^0-9.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  return s;
}

function TransactionGroupFormComponent({ group, onSuccess }: TransactionGroupFormProps) {
  const { isDark, colors } = useTheme();
  const theme: ThemeName = isDark ? "dark" : "light";
  const service = useTransactionGroupService();
  const { data: allGroups } = service.useFindAll();
  const { primaryCurrency } = usePrimaryCurrency();

  const iconRecents = useRecentValues("transaction-group:icon");
  const colorRecents = useRecentValues("transaction-group:color");
  const iconQuick = useMemo(
    () =>
      mergeRecents(
        iconRecents.recent,
        (allGroups ?? []).map(g => g.icon),
      ),
    [iconRecents.recent, allGroups],
  );
  const colorQuick = useMemo(
    () =>
      mergeRecents(
        colorRecents.recent,
        (allGroups ?? []).map(g => g.color),
      ),
    [colorRecents.recent, allGroups],
  );

  const [showAdvanced, setShowAdvanced] = useState(false);

  const initialFormData: TransactionGroupFormData = useMemo(() => ({ ...initialState, ...group }), [group]);
  const { formState, updateField, validateForm, isValid } = useFormState(initialFormData, validationSchema);
  const data = formState.data;

  const { mutate } = service.useUpsert();

  const handleSubmit = useCallback(
    async (submitData: TransactionGroupFormData) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          { form: submitData, original: group as TransactionGroup },
          {
            onSuccess: savedData => {
              iconRecents.record(submitData.icon);
              colorRecents.record(submitData.color);
              if (onSuccess) onSuccess(savedData);
              else router.replace("/Categories/Groups");
              resolve();
            },
            onError: reject,
          },
        );
      });
    },
    [mutate, group, onSuccess, iconRecents, colorRecents],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit);
  const onSubmit = useCallback(() => {
    if (validateForm()) submit(formState.data);
  }, [validateForm, submit, formState.data]);

  const swatch = data.color
    ? (swatchForHex(data.color, theme) ?? accentFor(data.name ?? "", theme))
    : accentFor(data.name ?? "", theme);
  const budgetString = data.budgetamount === null || data.budgetamount === undefined ? "" : String(data.budgetamount);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="gap-5 p-1">
        <View className="flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: swatch.soft }}>
            <MyIcon name={data.icon || "Shapes"} size={22} color={swatch.fg} />
          </View>
          <View className="min-w-0 flex-1">
            <Text variant="h3" numberOfLines={1}>
              {data.name || "New group"}
            </Text>
            <Text className="text-caption uppercase text-ink-mute">{data.type}</Text>
          </View>
        </View>

        <Input
          label="Group name"
          placeholder="Enter group name"
          value={data.name ?? ""}
          onChangeText={value => updateField("name", value)}
          error={formState.touched.name ? formState.errors.name : undefined}
          testID="group-name"
        />
        <View>
          <Text variant="label" className="mb-[7px]">
            Type
          </Text>
          <SegmentedControl
            options={[
              { key: "Income", label: "Income", tone: "success" },
              { key: "Expense", label: "Expense", tone: "danger" },
              { key: "Transfer", label: "Transfer", tone: "info" },
            ]}
            value={data.type}
            onChange={key => updateField("type", key)}
            testID="transactiongroup-type"
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
            testID="group-icon"
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
            testID="group-color"
          />
        </View>

        {/* Budget */}
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
                testID="group-budget"
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
              testID="group-frequency"
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
              <Input
                label="Description"
                placeholder="Optional description"
                multiline
                value={data.description ?? ""}
                onChangeText={value => updateField("description", value)}
                testID="group-description"
              />
              <Input
                label="Display order"
                keyboardType="number-pad"
                value={String(data.displayorder ?? 0)}
                onChangeText={value => updateField("displayorder", Number(value.replace(/[^0-9]/g, "")) || 0)}
                testID="group-order"
              />
            </View>
          ) : null}
        </View>

        {error ? (
          <View className="rounded-xl border border-danger bg-danger-soft p-3">
            <Text className="text-caption text-danger">{error.message || "Failed to save group"}</Text>
          </View>
        ) : null}

        <Button
          label={(group as any)?.id ? "Save Changes" : "Add Group"}
          onPress={onSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          leadingIcon="Check"
          testID="group-save"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const TransactionGroupForm = memo(TransactionGroupFormComponent);
export default TransactionGroupForm;
