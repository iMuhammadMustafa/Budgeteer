import { useEffect, useMemo, useCallback } from "react";
import { Platform, SafeAreaView, ScrollView, View, Switch, Text } from "react-native";
import { router } from "expo-router";

import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { AccountFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import FormSection from "./FormSection";
import { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";
import {
  createAccountNameValidation,
  commonValidationRules,
  createDescriptionValidation,
} from "@/src/utils/form-validation";

export default function AccountForm({ account }: { account: AccountFormType }) {
  const accountService = useAccountService();
  const accountCategoryService = useAccountCategoryService();
  const { data: accountCategories } = accountCategoryService.findAll();
  const { data: openTransaction } = accountService.getAccountOpenedTransaction(account.id);
  const { mutate: updateAccount } = accountService.upsert();
  const { mutate: updateOpenBalance } = accountService.updateAccountOpenedTransaction();

  // Create validation schema
  const validationSchema: ValidationSchema<AccountFormData> = useMemo(
    () => ({
      name: createAccountNameValidation(),
      categoryid: [commonValidationRules.required("Category is required")],
      balance: [
        commonValidationRules.required("Balance is required"),
        commonValidationRules.min(0, "Balance cannot be negative"),
      ],
      currency: [
        commonValidationRules.required("Currency is required"),
        commonValidationRules.minLength(3, "Currency must be at least 3 characters"),
        commonValidationRules.maxLength(3, "Currency must be exactly 3 characters"),
      ],
      notes: createDescriptionValidation(false),
    }),
    [],
  );

  // Initialize form state with validation
  const { formState, updateField, validateForm, resetForm, setFormData, setInitialFormData, isValid, isDirty } =
    useFormState<AccountFormData>(account, validationSchema);

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: AccountFormData) => {
      // Handle open balance update if needed
      if (openTransaction && data.openBalance !== null && data.openBalance !== undefined) {
        updateOpenBalance({
          id: openTransaction.id,
          amount: data.openBalance,
        });
      }

      // Submit account data
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

  // Form submission hook
  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Account saved successfully");
    },
    onError: error => {
      console.error("Failed to save account:", error);
    },
  });

  // Handle form submission
  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  // Handle running balance sync
  const handleSyncRunningBalance = useCallback(() => {
    if (account.runningbalance !== null && account.runningbalance !== undefined && account.id) {
      const updatedAccount: Updates<TableNames.Accounts> = {
        id: account.id,
        balance: account.runningbalance,
      };
      updateAccount({
        form: updatedAccount,
        original: account as Account,
        props: { addAdjustmentTransaction: false },
      });
    }
  }, [account, updateAccount]);

  // Initialize form data from props
  const initialFormData: AccountFormData = useMemo(
    () => ({
      ...account,
      openBalance: openTransaction?.amount || null,
      addAdjustmentTransaction: true,
    }),
    [account, openTransaction],
  );

  // Update form data when account prop changes (without triggering dirty state)
  useEffect(() => {
    setInitialFormData(initialFormData);
  }, [initialFormData, setInitialFormData]);

  // Handle open balance changes
  const handleOpenBalanceChange = useCallback(
    (value: any) => {
      const openBalanceValue = Number(value) || 0;
      const originalBalance = Number(account.balance) || 0;
      const originalOpenAmount = Number(openTransaction?.amount) || 0;

      // Calculate new balance based on open balance change
      const newBalance = originalBalance - originalOpenAmount + openBalanceValue;

      updateField("openBalance", openBalanceValue);
      updateField("balance", newBalance);
      updateField("addAdjustmentTransaction", false);
    },
    [account.balance, openTransaction?.amount, updateField],
  );

  // Custom reset handler that preserves open balance
  const handleReset = useCallback(() => {
    const currentOpenBalance = formState.data.openBalance;
    resetForm();
    // Restore the open balance after reset since it's managed separately
    if (currentOpenBalance !== null && currentOpenBalance !== undefined) {
      updateField("openBalance", currentOpenBalance);
    }
  }, [resetForm, formState.data.openBalance, updateField]);

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
    () => account.id && formState.data.runningbalance !== undefined && account.runningbalance !== account.balance,
    [account.id, account.runningbalance, account.balance, formState.data.runningbalance],
  );

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
          <FormSection title="Basic Information" description="Enter the account's basic details">
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
                  onSelect={(icon: any) => updateField("icon", icon)}
                  label="Icon"
                  initialIcon={formState.data.icon ?? "CircleHelp"}
                />
              </View>
              <ColorsPickerDropdown
                selectedValue={formState.data.color}
                handleSelect={value => updateField("color", value?.value)}
              />
            </View>
          </FormSection>

          {/* Financial Information Section */}
          <FormSection title="Financial Information" description="Set up the account's financial details">
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
                  onChange={value => updateField("balance", Number(value) || 0)}
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
                    value={formState.data.runningbalance?.toString()}
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

            {/* Open Balance (for existing accounts with opening transaction) */}
            {openTransaction && (
              <FormField
                config={{
                  name: "openBalance",
                  label: "Open Balance",
                  type: "number",
                  description: "Adjusting this will update the account balance accordingly",
                }}
                value={formState.data.openBalance?.toString() ?? "0"}
                onChange={handleOpenBalanceChange}
              />
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

export type AccountFormType = AccountFormData & {
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
};

export const initialState: AccountFormType = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
  runningbalance: null,
  openBalance: null,
  addAdjustmentTransaction: true,
};
