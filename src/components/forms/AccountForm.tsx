import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { ColorsPickerDropdown } from "@/src/components/elements/DropdownField";
import IconPicker from "@/src/components/elements/IconPicker";
import FormContainer from "@/src/components/form-builder/FormContainer";
import FormField from "@/src/components/form-builder/FormField";
import FormSection from "@/src/components/form-builder/FormSection";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { AccountFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Account, Updates } from "@/src/types/database/Tables.Types";
import { commonValidationRules, createAccountNameValidation } from "@/src/utils/form-validation";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFormState } from "../form-builder/hooks/useFormState";
import { useFormSubmission } from "../form-builder/hooks/useFormSubmission";

export default function AccountForm({ account }: { account: AccountFormData }) {
  const accountService = useAccountService();
  const accountCategoryService = useAccountCategoryService();
  const { data: accountCategories } = accountCategoryService.useFindAll();
  const { data: openTransaction } = accountService.useGetAccountOpenedTransaction(account.id);
  const { mutate: updateAccount } = accountService.useUpsert();
  const { mutate: updateOpenBalance } = accountService.useUpdateAccountOpenedTransaction();
  const { data: runningBalance, isLoading: isLoadingRunningBalance } = accountService.useGetAccountRunningBalance(
    account.id,
  );

  const initialFormData: AccountFormData = useMemo(
    () => ({
      ...account,
      openBalance: openTransaction?.amount || null,
      addAdjustmentTransaction: true,
    }),
    [account, openTransaction, runningBalance],
  );

  const validationSchema: ValidationSchema<AccountFormData> = useMemo(
    () => ({
      name: createAccountNameValidation(),
      categoryid: [commonValidationRules.required("Category is required")],
      balance: [commonValidationRules.required("Balance is required")],
      statementdate: [
        {
          type: "custom",
          message: "Statement date must be between 1 and 31",
          validator: (value: any) => (value ? value >= 1 && value <= 31 : true),
        },
      ],
    }),
    [],
  );

  const { formState, updateField, validateForm, resetForm, setInitialFormData, isValid, isDirty } =
    useFormState<AccountFormData>(initialFormData, validationSchema);

  const handleSubmit = useCallback(
    async (data: AccountFormData) => {
      // Handle open balance update if needed
      if (openTransaction && data.openBalance !== null && data.openBalance !== undefined) {
        updateOpenBalance({
          id: openTransaction.id,
          amount: data.openBalance,
        });
      }

      await new Promise<void>((resolve, reject) => {
        updateAccount(
          {
            form: { ...data },
            original: account as Account,
            props: { addAdjustmentTransaction: data.addAdjustmentTransaction || false },
          },
          {
            onSuccess: () => {
              router.navigate("/Accounts");
              resolve();
            },
            onError: error => {
              console.error("Error updating account:", error);
              reject(error);
            },
          },
        );
      });
    },
    [updateAccount, updateOpenBalance, openTransaction, account],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Account saved successfully");
    },
    onError: error => {
      console.error("Failed to save account:", error);
    },
  });

  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  const handleSyncRunningBalance = useCallback(() => {
    if (runningBalance !== null && runningBalance !== undefined && account.id) {
      const updatedAccount: Updates<TableNames.Accounts> = {
        id: account.id,
        balance: runningBalance,
      };
      updateAccount({
        form: updatedAccount,
        original: account as Account,
        props: { addAdjustmentTransaction: false },
      });
      // Also update form state to reflect new balance
      // updateField("balance", runningBalance);
      setInitialFormData({
        ...formState.data,
        balance: runningBalance,
      });
    }
  }, [account, updateAccount]);

  const handleOpenBalanceChange = useCallback(
    (value: any) => {
      const openBalanceValue = Number(value) || 0;
      const originalBalance = Number(account.balance) || 0;
      const originalOpenAmount = Number(openTransaction?.amount) || 0;

      // Calculate new balance based on open balance change
      const newBalance = originalBalance - originalOpenAmount + openBalanceValue;

      // Update open balance and related fields
      // Note: This will affect dirty state, but open balance is treated as separate
      updateField("openBalance", openBalanceValue);
      updateField("balance", newBalance);
      updateField("addAdjustmentTransaction", false);
    },
    [account.balance, openTransaction?.amount, updateField],
  );

  // Reset open balance to its original value (separate from main form reset)
  const handleResetOpenBalance = useCallback(() => {
    const originalOpenBalance = openTransaction?.amount || null;
    const originalBalance = Number(account.balance) || 0;
    const currentOpenAmount = Number(formState.data.openBalance) || 0;

    // Calculate the balance adjustment needed
    const adjustedBalance = originalBalance - currentOpenAmount + (originalOpenBalance || 0);

    // Reset open balance to original value
    updateField("openBalance", originalOpenBalance);
    updateField("balance", adjustedBalance);
  }, [openTransaction?.amount, account.balance, formState.data.openBalance, updateField]);

  const handleIconSelect = useCallback(
    (icon: string) => {
      updateField("icon", icon);
    },
    [updateField],
  );
  // Custom reset handler that preserves open balance field
  const handleReset = useCallback(() => {
    // Store the current open balance since it's managed as a separate form
    const currentOpenBalance = formState.data.openBalance;
    const originalOpenBalance = openTransaction?.amount || null;

    // Create new initial data that preserves the open balance field
    // The open balance is treated as a separate form, so we preserve its current state
    const resetData = {
      ...initialFormData,
      openBalance: currentOpenBalance, // Preserve current open balance value
    };

    // Use setInitialFormData to reset without triggering dirty state
    // This properly resets the form while preserving the open balance
    setInitialFormData(resetData);
  }, [initialFormData, formState.data.openBalance, setInitialFormData]);

  // Prepare dropdown options for categories
  const categoryOptions = useMemo(
    () =>
      accountCategories?.map(item => ({
        id: item.id,
        label: item.name,
        value: item.id,
        icon: item.icon,
        group: item.type,
      })) ?? [],
    [accountCategories],
  );

  // Check if running balance sync is needed
  const needsRunningBalanceSync = useMemo(
    () => account.id && runningBalance !== account.balance,
    [account.id, runningBalance, account.balance],
  );

  // Check if selected category is a liability (for statement date field)
  const isLiabilityAccount = useMemo(
    () => accountCategories?.find(cat => cat.id === formState.data.categoryid)?.type === "Liability",
    [accountCategories, formState.data.categoryid],
  );

  if (isLoadingRunningBalance) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        <FormContainer
          onSubmit={onSubmit}
          isValid={isValid && !isSubmitting}
          isLoading={isSubmitting}
          submitLabel="Save Account"
          showReset={isDirty}
          onReset={handleReset}
        >
          {/* Basic Information Section */}
          <FormSection title="Basic Information" description="Enter the account's basic details" className="z-10">
            <FormField
              config={{
                name: "name",
                label: "Account Name",
                type: "text",
                required: true,
                placeholder: "Enter account name",
              }}
              value={formState.data.name}
              error={formState.errors.name}
              touched={formState.touched.name}
              onChange={value => updateField("name", value)}
              onBlur={() => updateField("name", formState.data.name)}
            />

            <FormField
              config={{
                name: "owner",
                label: "Owner",
                type: "text",
                placeholder: "Enter account owner",
              }}
              value={formState.data.owner}
              error={formState.errors.owner}
              touched={formState.touched.owner}
              onChange={value => updateField("owner", value)}
            />

            <FormField
              config={{
                name: "categoryid",
                label: "Category",
                type: "select",
                required: true,
                options: categoryOptions,
              }}
              value={formState.data.categoryid}
              error={formState.errors.categoryid}
              touched={formState.touched.categoryid}
              onChange={value => updateField("categoryid", value)}
            />
          </FormSection>

          {/* Appearance Section */}
          <FormSection title="Appearance" description="Customize the account's visual appearance">
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between`}>
              <View className="flex-1">
                <IconPicker
                  onSelect={(icon: any) => handleIconSelect(icon)}
                  initialIcon={formState.data.icon ?? "BadgeInfo"}
                />
              </View>
              <ColorsPickerDropdown
                selectedValue={formState.data.color}
                handleSelect={value => updateField("color", value?.value)}
              />
            </View>
          </FormSection>

          {/* Financial Information Section */}
          <FormSection
            title="Financial Information"
            description="Set up the account's financial details"
            className="-z-10"
          >
            <FormField
              config={{
                name: "currency",
                label: "Currency",
                type: "text",
                required: true,
                placeholder: "USD",
              }}
              value={formState.data.currency}
              error={formState.errors.currency}
              touched={formState.touched.currency}
              onChange={value => updateField("currency", value)}
            />

            <View className="flex flex-row items-center justify-between">
              <View style={{ flex: 1 }}>
                <FormField
                  config={{
                    name: "balance",
                    label: "Balance",
                    type: "number",
                    required: true,
                    placeholder: "0.00",
                  }}
                  value={formState.data.balance?.toString()}
                  error={formState.errors.balance}
                  touched={formState.touched.balance}
                  onChange={value => updateField("balance", value)}
                  onBlur={() => {
                    const val = formState.data.balance;
                    if (val === null || val === undefined) {
                      updateField("balance", null);
                    } else if (typeof val === "string") {
                      const strVal: string = val;
                      if (strVal.trim() === "") {
                        updateField("balance", null);
                      } else if (!isNaN(Number(strVal))) {
                        updateField("balance", Number(strVal));
                      }
                    } else if (typeof val === "number") {
                      updateField("balance", val);
                    }
                  }}
                />
              </View>

              {account.id && (
                <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                  <FormField
                    config={{
                      name: "addAdjustmentTransaction",
                      label: "Add Adjustment Transaction",
                      type: "switch",
                    }}
                    value={formState.data.addAdjustmentTransaction}
                    onChange={value => updateField("addAdjustmentTransaction", value)}
                  />
                </View>
              )}
            </View>

            {/* Running Balance Sync */}
            {needsRunningBalanceSync && (
              <View className="flex flex-row items-center justify-center gap-2">
                <View style={{ flex: 1 }}>
                  <FormField
                    config={{
                      name: "runningbalance",
                      label: "Running Balance",
                      type: "number",
                      disabled: true,
                    }}
                    value={runningBalance}
                    onChange={() => {}} // Read-only field
                  />
                </View>
                <View className="mt-6">
                  <Text
                    className="text-blue-600 underline p-2"
                    onPress={handleSyncRunningBalance}
                    accessibilityRole="button"
                    accessibilityLabel="Sync running balance with current balance"
                  >
                    Sync
                  </Text>
                </View>
              </View>
            )}

            {/* Statement Date (for liability accounts - credit cards) */}
            {isLiabilityAccount && (
              <FormField
                config={{
                  name: "statementdate",
                  label: "Statement Date",
                  type: "number",
                  placeholder: "15",
                  description: "Day of month (1-31) when credit card statement closes. Leave empty if not applicable.",
                  validation: [
                    {
                      type: "custom",
                      message: "Statement date must be between 1 and 31",
                      validator: (value: any) => (value ? value >= 1 && value <= 31 : true),
                    },
                  ],
                }}
                value={formState.data.statementdate?.toString() ?? ""}
                error={formState.errors.statementdate}
                touched={formState.touched.statementdate}
                onChange={value => {
                  const numValue = value ? Number(value) : null;
                  updateField("statementdate", numValue);
                }}
                onBlur={() => {
                  const val = formState.data.statementdate;
                  if (val === null || val === undefined || val === 0) {
                    updateField("statementdate", null);
                  }
                }}
              />
            )}

            {/* Open Balance (for existing accounts with opening transaction) */}
            {openTransaction && (
              <View className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-700">Open Balance (Separate Form)</Text>
                  <Text
                    className="text-blue-600 underline text-sm"
                    onPress={handleResetOpenBalance}
                    accessibilityRole="button"
                    accessibilityLabel="Reset open balance to original value"
                  >
                    Reset
                  </Text>
                </View>
                <FormField
                  config={{
                    name: "openBalance",
                    label: "Open Balance",
                    type: "number",
                    description:
                      "Adjusting this will update the account balance accordingly. This field is managed separately from the main form.",
                  }}
                  value={formState.data.openBalance?.toString() ?? "0"}
                  onChange={handleOpenBalanceChange}
                />
              </View>
            )}
          </FormSection>

          {/* Additional Information Section */}
          <FormSection title="Additional Information" description="Optional notes and comments">
            <FormField
              config={{
                name: "notes",
                label: "Notes",
                type: "textarea",
                placeholder: "Enter any additional notes about this account",
              }}
              value={formState.data.notes}
              error={formState.errors.notes}
              touched={formState.touched.notes}
              onChange={value => updateField("notes", value)}
            />
          </FormSection>

          {/* Display submission error if any */}
          {error && (
            <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-700 text-sm">Error: {error.message}</Text>
            </View>
          )}
        </FormContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

export const initialState: AccountFormData = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  description: "",
  notes: "",
  icon: "BadgeInfo",
  color: "info-100",
  displayorder: 0,
  owner: "",
  statementdate: null,
  tenantid: "",
  isdeleted: false,
  createdby: null,
  updatedby: null,
  openBalance: null,
  addAdjustmentTransaction: true,
};
