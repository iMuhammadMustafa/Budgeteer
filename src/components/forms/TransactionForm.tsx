import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.Types";
import { OptionItem, TransactionFormData, ValidationSchema } from "@/src/types/components/forms.types";
import { Transaction } from "@/src/types/database/Tables.Types";
import { commonValidationRules, createDateValidation, createDescriptionValidation } from "@/src/utils/form-validation";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CalculatorComponent from "../Calculator";
import Button from "../elements/Button";
import ModeIcon from "../elements/ModeIcon";
import MyIcon from "../elements/MyIcon";
import SearchableDropdown from "../elements/SearchableDropdown";
import FormContainer from "../form-builder/FormContainer";
import FormField from "../form-builder/FormField";
import FormSection from "../form-builder/FormSection";
import { useFormState, useFormSubmission } from "../form-builder/hooks";

export type TransactionFormType = TransactionFormData & {
  mode?: "plus" | "minus";
};

export const initialTransactionState: TransactionFormType = {
  id: undefined,
  name: "",
  payee: "",
  description: "",
  date: dayjs().local().format("YYYY-MM-DDTHH:mm:ss"),
  amount: 0,
  type: "Expense",
  accountid: "",
  categoryid: "",
  notes: "",
  tags: null,
  isvoid: false,
  transferid: "",
  transferaccountid: null,
  mode: "minus",
  // Required TransactionFormData fields from DB
  createdby: "",
  updatedby: "",
  tenantid: "",
  isdeleted: false,
};

const TRANSACTION_TYPE_CONFIG = {
  Income: { mode: "plus", defaultName: "Income" },
  Expense: { mode: "minus", defaultName: "Expense" },
  Transfer: { mode: "minus", defaultName: "Transfer" },
} as const;
const transactionTypeOptions: OptionItem[] = [
  { id: "Income", label: "Income", value: "Income" },
  { id: "Expense", label: "Expense", value: "Expense" },
  { id: "Transfer", label: "Transfer", value: "Transfer" },
];
const getValidationSchema = (type: string): ValidationSchema<TransactionFormType> => {
  const baseSchema: ValidationSchema<TransactionFormType> = {
    name: [commonValidationRules.required("Transaction name is required")],
    // amount: createAmountValidation(),
    date: createDateValidation(),
    accountid: [commonValidationRules.required("Account is required")],
    categoryid: [commonValidationRules.required("Category is required")],
    type: [commonValidationRules.required("Transaction type is required")],
    description: createDescriptionValidation(false),
    notes: createDescriptionValidation(false),
  };

  // Add validation for transfer account
  if (type === "Transfer") {
    baseSchema.transferaccountid = [
      commonValidationRules.required("Destination account is required"),
      commonValidationRules.custom(
        (value, formData) => value !== formData?.accountid,
        "Destination account must be different from source account",
      ),
    ];
  }

  return baseSchema;
};

const calculateFinalAmount = (data: TransactionFormType, currentMode: "plus" | "minus"): number => {
  let finalAmount = Math.abs(data.amount);

  // Apply sign based on transaction type and mode

  switch (data.type) {
    case "Transfer":
      // Transfers are always negative from source account
      return -finalAmount;
    case "Income":
      // Income is always positive
      return finalAmount;
    case "Expense":
      // Expense is always negative
      return -finalAmount;
    default:
      // Fallback to mode-based calculation
      return currentMode === "minus" ? -finalAmount : finalAmount;
  }
};

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const {
    onSubmit,
    isValid,
    isSubmitting,
    isLoading,
    isDirty,
    resetForm,
    handleOnMoreSubmit,
    findByName,
    onSelectItem,
    updateField,
    formState,
    setFieldTouched,
    mode,
    handleModeToggle,
    handleTypeChange,
    handleSwitchAccounts,
    handleAmountChange,
    handleCalculatorResult,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    error,
  } = useTransactionForm({ transaction });

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        <FormContainer
          onSubmit={onSubmit}
          isValid={isValid && !isSubmitting}
          isLoading={isSubmitting}
          submitLabel="Save Transaction"
          showReset={isDirty}
          onReset={resetForm}
        >
          <View className="flex-row justify-end mb-4 gap-2">
            <Button
              label="Clear"
              variant="secondary"
              className="bg-red-500 rounded-md"
              disabled={isLoading}
              onPress={() => router.replace("/AddTransaction")}
              leftIcon="Trash"
              size="sm"
            />
            <Button
              label="One More"
              variant="primary"
              className="bg-primary-300 rounded-md"
              disabled={isLoading}
              onPress={handleOnMoreSubmit}
              leftIcon="Plus"
              size="sm"
            />
          </View>

          <View className="mb-2 z-50">
            <SearchableDropdown
              label="Name"
              searchAction={findByName}
              initalValue={transaction.name}
              onSelectItem={onSelectItem}
              onChange={val => updateField("name", val)}
            />
          </View>

          {formState.data.type !== "Transfer" && (
            <FormField
              config={{
                name: "payee",
                label: "Payee",
                type: "text",
                placeholder: "Enter payee name",
                required: false,
              }}
              value={formState.data.payee}
              error={formState.errors.payee}
              touched={formState.touched.payee}
              onChange={value => updateField("payee", value)}
              onBlur={() => setFieldTouched("payee")}
            />
          )}

          <FormField
            config={{
              name: "date",
              label: "Date",
              type: "date",
              required: true,
              popUp: Platform.OS !== "web",
            }}
            value={formState.data.date}
            error={formState.errors.date}
            touched={formState.touched.date}
            onChange={value => {
              if (value) {
                const formattedDate = dayjs(value);
                updateField("date", formattedDate);
              }
            }}
            onBlur={() => setFieldTouched("date")}
          />

          <View className="flex-row justify-center items-center mb-4">
            <View className="me-2 mt-5 justify-center items-center">
              <ModeIcon onPress={handleModeToggle} mode={mode} />
            </View>
            <View className="flex-1">
              <FormField
                config={{
                  name: "amount",
                  label: "Amount",
                  type: "number",
                  required: true,
                  placeholder: "0.00",
                }}
                value={formState.data.amount?.toString()}
                error={formState.errors.amount}
                touched={formState.touched.amount}
                onChange={handleAmountChange}
              />
            </View>

            <CalculatorComponent onSubmit={handleCalculatorResult} currentValue={formState.data.amount} />
          </View>

          <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} z-40`}>
            <View className="flex-1">
              <FormField
                config={{
                  name: "categoryid",
                  label: "Category",
                  type: "select",
                  required: true,
                  options: categoryOptions,
                  group: "group.name",
                }}
                value={formState.data.categoryid}
                error={formState.errors.categoryid}
                touched={formState.touched.categoryid}
                onChange={value => updateField("categoryid", value)}
                onBlur={() => setFieldTouched("categoryid")}
              />
            </View>

        {/* TODO: Convert to Switcher */}
            <View className="flex-1">
              <FormField
                config={{
                  name: "type",
                  label: "Type",
                  type: "select",
                  required: true,
                  options: transactionTypeOptions,
                  popUp: Platform.OS !== "web",
                }}
                value={formState.data.type}
                error={formState.errors.type}
                touched={formState.touched.type}
                onChange={handleTypeChange}
                onBlur={() => setFieldTouched("type")}
              />
            </View>         
          </View>

          {/* Account Information Section */}
          <FormSection className="z-30">
            <View className={`${Platform.OS === "web" ? "flex flex-row items-center" : ""} z-20`}>
              <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                <FormField
                  config={{
                    name: "accountid",
                    label: "Account",
                    type: "select",
                    required: true,
                    options: accountOptions,
                    group: "category.name",
                  }}
                  value={formState.data.accountid}
                  error={formState.errors.accountid}
                  touched={formState.touched.accountid}
                  onChange={value => updateField("accountid", value)}
                  onBlur={() => setFieldTouched("accountid")}
                />
              </View>

              {formState.data.type === "Transfer" && (
                <>
                  <Pressable
                    onPress={handleSwitchAccounts}
                    className={`${Platform.OS === "web" ? "mx-2" : "my-2"} "p-2 self-center`}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Switch source and destination accounts"
                  >
                    <MyIcon name="ArrowUpDown" size={24} className="text-foreground" />
                  </Pressable>

                  <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                    <FormField
                      config={{
                        name: "transferaccountid",
                        label: "Destination Account",
                        type: "select",
                        required: true,
                        options: transferAccountOptions,
                        group: "category.name",
                      }}
                      value={formState.data.transferaccountid}
                      error={formState.errors.transferaccountid}
                      touched={formState.touched.transferaccountid}
                      onChange={value => updateField("transferaccountid", value)}
                      onBlur={() => setFieldTouched("transferaccountid")}
                    />
                  </View>
                </>
              )}
            </View>
          </FormSection>

          {/* Additional Information Section */}
          <FormSection title="Additional Information" description="Optional notes and tags">
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} relative z-10`}>
              <FormField
                config={{
                  name: "tags",
                  label: "Tags",
                  type: "multiselect",
                  placeholder: "Enter tags separated by commas",
                  description: "Add tags to categorize and search transactions",
                }}
                value={formState.data.tags}
                error={formState.errors.tags}
                touched={formState.touched.tags}
                onChange={value =>
                  updateField("tags", Array.isArray(value) ? value : value?.split(",").filter(Boolean))
                }
                onBlur={() => setFieldTouched("tags")}
                className="flex-1"
              />

              <FormField
                config={{
                  name: "notes",
                  label: "Notes",
                  type: "textarea",
                  placeholder: "Enter any additional notes",
                  description: "Optional notes about this transaction",
                }}
                value={formState.data.notes}
                error={formState.errors.notes}
                touched={formState.touched.notes}
                onChange={value => updateField("notes", value)}
                onBlur={() => setFieldTouched("notes")}
                className="flex-1"
              />
            </View>
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

const useTransactionForm = ({ transaction }: { transaction: TransactionFormType }) => {
    // ...existing code...
  const transactionCategoryService = useTransactionCategoryService();
  const accountService = useAccountService();
  const transactionService = useTransactionService();

  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoryService.useFindAll();
  const { data: accounts, isLoading: isAccountLoading } = accountService.useFindAll();
  const { mutate: upsertTransaction } = transactionService.useUpsert();

  const [mode, setMode] = useState<"plus" | "minus">("minus");

  const initialFormData: TransactionFormType = useMemo(
    () => ({
      ...transaction,
      amount: Math.abs(transaction.amount ?? 0),
      mode: transaction.amount && transaction.amount !== 0 ? (transaction.amount < 0 ? "minus" : "plus") : "minus",
    }),
    [transaction],
  );

  const [transactionType, setTransactionType] = useState<string>(initialFormData.type);

  const validationSchema = useMemo(() => getValidationSchema(transactionType), [transactionType]);
  const { formState, updateField, setFieldTouched, validateForm, resetForm, setFormData, isValid, isDirty } =
    useFormState<TransactionFormType>(initialFormData, validationSchema);

  const handleSubmit = useCallback(
    async (data: TransactionFormType) => {
      if (data.type === "Transfer" && data.accountid === data.transferaccountid) {
        throw new Error("Source and destination accounts must be different");
      }

      const finalAmount = calculateFinalAmount(data, mode);

      const submissionData = {
        ...data,
        amount: finalAmount,
        mode: undefined,
        payee: data.type === "Transfer" ? null : data.payee,
      };

      await upsertTransaction(
        {
          form: submissionData,
          original: transaction.id ? (transaction as Transaction) : undefined,
        },
        {
          onError: error => {
            console.error("Error saving transaction:", error);
          },
        },
      );
    },
    [upsertTransaction, transaction, mode],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Transaction saved successfully");
    },
    onError: error => {
      console.error("Failed to save transaction:", error);
    },
  });

  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
      resetForm();
      router.navigate("/Transactions");
    }
  }, [validateForm, submit, formState.data, resetForm]);

  const handleOnMoreSubmit = useCallback(() => {
    if (validateForm()) {
      const updatedDate = dayjs(formState.data.date).local().add(1, "second").format("YYYY-MM-DDTHH:mm:ss");

      const newTransactionData: TransactionFormType = {
        ...formState.data,
        date: updatedDate,
      };

      submit(formState.data).then(() => {
        setFormData(newTransactionData);
      });
    }
  }, [validateForm, submit, formState.data, setFormData]);

  // Synchronize mode state with form data
  useEffect(() => {
    const currentMode = formState.data.mode || (transaction.amount && transaction.amount < 0 ? "minus" : "plus");
    setMode(currentMode);
  }, [formState.data.mode, transaction.amount]);

  // Handle mode changes
  const handleModeToggle = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    const newMode = mode === "plus" ? "minus" : "plus";
    setMode(newMode);
    updateField("mode", newMode);
  }, [mode, updateField]);

  // Enhanced transaction type change handling
  const handleTypeChange = useCallback(
    (type: string) => {
      const typeConfig = TRANSACTION_TYPE_CONFIG[type as keyof typeof TRANSACTION_TYPE_CONFIG];

      if (!typeConfig) {
        console.warn(`Unknown transaction type: ${type}`);
        return;
      }

      // Update type and mode
      updateField("type", type);
      setMode(typeConfig.mode);
      updateField("mode", typeConfig.mode);
      setTransactionType(type);

      // Set default name if current name is empty or matches previous type
      if (
        !formState.data.name ||
        Object.values(TRANSACTION_TYPE_CONFIG).some(config => formState.data.name === config.defaultName)
      ) {
        updateField("name", typeConfig.defaultName);
      }

      // Handle transfer-specific logic
      if (type === "Transfer") {
        // Clear payee for transfers
        updateField("payee", "");

        // Find and set transfer category
        const transferCategory = categories?.find(
          category =>
            category.name?.toLowerCase().includes("transfer") || category.name?.toLowerCase().includes("account"),
        );
        if (transferCategory) {
          updateField("categoryid", transferCategory.id);
        }
      } else {
        // Clear transfer account for non-transfers
        updateField("transferaccountid", null);
      }
    },
    [updateField, categories, formState.data.name],
  );

  // Enhanced account switching for transfers with validation
  const handleSwitchAccounts = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }

    const currentAccountId = formState.data.accountid;
    const currentTransferAccountId = formState.data.transferaccountid;

    // Only switch if both accounts are selected
    if (currentAccountId && currentTransferAccountId) {
      updateField("accountid", currentTransferAccountId);
      updateField("transferaccountid", currentAccountId);
    } else if (currentAccountId && !currentTransferAccountId) {
      // If only source account is selected, clear it and wait for user to select destination
      updateField("accountid", "");
    }
  }, [formState.data.accountid, formState.data.transferaccountid, updateField]);

  // Enhanced searchable dropdown selection with better data handling
  const onSelectItem = useCallback(
    (item: SearchableDropdownItem) => {
      const selectedTransaction = item.item;

      // Determine mode based on transaction type and amount
      let selectedMode: "plus" | "minus" = "minus";
      if (selectedTransaction.type === "Income") {
        selectedMode = "plus";
      } else if (selectedTransaction.type === "Transfer" || selectedTransaction.type === "Expense") {
        selectedMode = "minus";
      } else {
        selectedMode = selectedTransaction.amount < 0 ? "minus" : "plus";
      }

      setMode(selectedMode);

      // Populate form with selected transaction data
      const populatedData: Partial<TransactionFormType> = {
        ...selectedTransaction,
        amount: Math.abs(selectedTransaction.amount),
        mode: selectedMode,
        // Preserve current date unless it's a new transaction
        date: transaction.id ? selectedTransaction.date : formState.data.date,
        // Clear ID for new transactions based on existing transaction
        id: transaction.id || undefined,
      };

      setFormData(populatedData);
    },
    [setFormData, transaction.id, formState.data.date],
  );

  // Enhanced amount change handling with better validation
  const handleAmountChange = useCallback(
    (value: string) => {
      // Allow user to type a trailing decimal (e.g., "3.")
      let cleanValue = value
        .replace(/[^0-9.-]/g, "")
        .replace(/(?!^)-/g, "")
        .replace(/\.{2,}/g, ".")
        .replace(/^0+(?=\d)/, "");

      if (cleanValue.startsWith("-")) {
        if (formState.data.type !== "Transfer" && formState.data.type !== "Income") {
          setMode("minus");
          updateField("mode", "minus");
        }
        cleanValue = cleanValue.replace("-", "");
      }

      // Only allow one decimal point
      const decimalIndex = cleanValue.indexOf(".");
      if (decimalIndex !== -1) {
        const beforeDecimal = cleanValue.substring(0, decimalIndex);
        const afterDecimal = cleanValue.substring(decimalIndex + 1).replace(/\./g, "");
        cleanValue = beforeDecimal + "." + afterDecimal;
      }

      // Limit decimal places to 2, but allow trailing decimal
      if (cleanValue.includes(".")) {
        const parts = cleanValue.split(".");
        if (parts[1] && parts[1].length > 2) {
          cleanValue = parts[0] + "." + parts[1].substring(0, 2);
        }
      }

      // Allow empty or just "." input
      if (cleanValue === "" || cleanValue === ".") {
        updateField("amount", cleanValue);
        return;
      }

      // Allow trailing decimal (e.g., "3.")
      if (/^\d+\.$/.test(cleanValue)) {
        updateField("amount", cleanValue);
        return;
      }

      // Validate maximum amount
      const numericAmount = parseFloat(cleanValue);
      if (!isNaN(numericAmount) && numericAmount > 999999999.99) {
        return;
      }

      // If valid number or decimal, update as string to preserve input
      updateField("amount", cleanValue);
    },
    [updateField, formState.data.type, setMode],
  );

  // Enhanced calculator result handling
  const handleCalculatorResult = useCallback(
    (result: string) => {
      const numericResult = parseFloat(result);

      if (isNaN(numericResult) || !isFinite(numericResult)) {
        console.warn("Invalid calculator result:", result);
        return;
      }

      const amount = Math.abs(numericResult);

      // Validate maximum amount
      if (amount > 999999999.99) {
        console.warn("Calculator result exceeds maximum amount");
        return;
      }

      // Round to 2 decimal places
      const roundedAmount = Math.round(amount * 100) / 100;
      updateField("amount", roundedAmount);
    },
    [updateField],
  );

  // Enhanced dropdown options with better filtering and sorting
  const categoryOptions = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter(item => item.name) // Filter out categories without names
      .map(item => ({
        id: item.id,
        label: item.name || "",
        value: item.id,
        icon: item.icon,
        color: item.color,
        group: item.group!.name || "Uncategorized",
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [categories]);

  const accountOptions = useMemo(() => {
    if (!accounts) return [];

    return accounts
      .filter(item => item.name) // Filter out accounts without names
      .map(item => ({
        id: item.id,
        label: item.name || "",
        value: item.id,
        // Accounts do not have categoryname, fallback to "Other"
        group: item.category?.name ?? "Other",
      }))
      .sort((a, b) => {
        // Sort by group first, then by name
        if (a.group !== b.group) {
          return a.group.localeCompare(b.group);
        }
        return a.label.localeCompare(b.label);
      });
  }, [accounts]);

  // Filter account options for transfer destination (exclude source account)
  const transferAccountOptions = useMemo(() => {
    return accountOptions.filter(account => account.id !== formState.data.accountid);
  }, [accountOptions, formState.data.accountid]);

  const isEdit = !!transaction.id;
  const isLoading = isSubmitting || isCategoriesLoading || isAccountLoading;

  return {
    formState,
    updateField,
    setFieldTouched,
    isValid,
    isDirty,
    isSubmitting,
    isCategoriesLoading,
    isAccountLoading,
    onSubmit,
    resetForm,
    handleOnMoreSubmit,
    mode,
    handleModeToggle,
    handleTypeChange,
    handleSwitchAccounts,
    onSelectItem,
    handleAmountChange,
    handleCalculatorResult,
    categoryOptions,
    accountOptions,
    transferAccountOptions,
    error,
    isEdit,
    isLoading,
    findByName: transactionService.useFindByName,
  };
};
