import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, SafeAreaView, ScrollView, Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { Account, Transaction } from "@/src/types/db/Tables.Types";
import { TransactionFormData, ValidationSchema, OptionItem } from "@/src/types/components/forms.types";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import FormSection from "./FormSection";
import SearchableDropdown from "../SearchableDropdown";
import MyIcon from "@/src/utils/Icons.Helper";
import CalculatorComponent from "../Calculator";
import { getTransactionsByName } from "@/src/repositories";
import { SearchableDropdownItem } from "@/src/types/components/DropdownField.types";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useTransactionService } from "@/src/services/Transactions.Service";
import { 
  commonValidationRules, 
  createAmountValidation, 
  createDateValidation,
  createDescriptionValidation 
} from "@/src/utils/form-validation";

dayjs.extend(utc);
dayjs.extend(timezone);

export type TransactionFormType = TransactionFormData & {
  // Additional fields for form handling
  mode?: 'plus' | 'minus';
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
  mode: 'minus',
};

// Transaction type configurations
const TRANSACTION_TYPE_CONFIG = {
  Income: { mode: 'plus', defaultName: 'Income', requiresPayee: true },
  Expense: { mode: 'minus', defaultName: 'Expense', requiresPayee: true },
  Transfer: { mode: 'minus', defaultName: 'Transfer', requiresPayee: false },
} as const;

export default function TransactionForm({ transaction }: { transaction: TransactionFormType }) {
  const transactionCategoryService = useTransactionCategoryService();
  const accountService = useAccountService();
  const transactionService = useTransactionService();

  const { data: categories, isLoading: isCategoriesLoading } = transactionCategoryService.findAll();
  const { data: accounts, isLoading: isAccountLoading } = accountService.findAll();
  const { mutate: upsertTransaction } = transactionService.upsert();

  const [mode, setMode] = useState<'plus' | 'minus'>('minus');

  // Create validation schema with dynamic rules based on transaction type
  const validationSchema: ValidationSchema<TransactionFormType> = useMemo(() => {
    const baseSchema: ValidationSchema<TransactionFormType> = {
      name: [commonValidationRules.required('Transaction name is required')],
      amount: createAmountValidation(),
      date: createDateValidation(),
      accountid: [commonValidationRules.required('Account is required')],
      categoryid: [commonValidationRules.required('Category is required')],
      type: [commonValidationRules.required('Transaction type is required')],
      description: createDescriptionValidation(false),
      notes: createDescriptionValidation(false),
    };

    // Add conditional validation for payee based on transaction type
    baseSchema.payee = formState?.data?.type === 'Transfer' 
      ? [] // Payee not required for transfers
      : [commonValidationRules.required('Payee is required')];

    // Add validation for transfer account
    if (formState?.data?.type === 'Transfer') {
      baseSchema.transferaccountid = [
        commonValidationRules.required('Destination account is required'),
        commonValidationRules.custom(
          (value, formData) => value !== formData?.accountid,
          'Destination account must be different from source account'
        ),
      ];
    }

    return baseSchema;
  }, [formState?.data?.type]);

  // Initialize form state with validation
  const {
    formState,
    updateField,
    setFieldTouched,
    validateForm,
    resetForm,
    setFormData,
    isValid,
    isDirty,
  } = useFormState<TransactionFormType>({
    ...transaction,
    amount: Math.abs(transaction.amount ?? 0),
    mode: transaction.amount && transaction.amount < 0 ? 'minus' : 'plus',
  }, validationSchema);

  // Enhanced amount calculation with better logic
  const calculateFinalAmount = useCallback((data: TransactionFormType, currentMode: 'plus' | 'minus'): number => {
    let finalAmount = Math.abs(data.amount);
    
    // Apply sign based on transaction type and mode
    switch (data.type) {
      case 'Transfer':
        // Transfers are always negative from source account
        return -finalAmount;
      case 'Income':
        // Income is always positive
        return finalAmount;
      case 'Expense':
        // Expense is always negative
        return -finalAmount;
      default:
        // Fallback to mode-based calculation
        return currentMode === 'minus' ? -finalAmount : finalAmount;
    }
  }, []);

  // Handle form submission with enhanced error handling
  const handleSubmit = useCallback(async (data: TransactionFormType) => {
    try {
      // Validate transfer accounts are different
      if (data.type === 'Transfer' && data.accountid === data.transferaccountid) {
        throw new Error('Source and destination accounts must be different');
      }

      const finalAmount = calculateFinalAmount(data, mode);
      
      const submissionData = {
        ...data,
        amount: finalAmount,
        // Clean up form-specific fields
        mode: undefined,
        // Ensure payee is empty for transfers
        payee: data.type === 'Transfer' ? '' : data.payee,
      };

      await new Promise<void>((resolve, reject) => {
        upsertTransaction(
          { 
            form: submissionData, 
            original: transaction.id ? transaction as Transaction : undefined 
          },
          {
            onSuccess: () => {
              router.navigate("/Transactions");
              resolve();
            },
            onError: (error) => {
              console.error("Error saving transaction:", error);
              reject(error);
            },
          },
        );
      });
    } catch (error) {
      console.error("Transaction submission failed:", error);
      throw error;
    }
  }, [upsertTransaction, transaction, mode, calculateFinalAmount]);

  // Form submission hook
  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log('Transaction saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save transaction:', error);
    },
  });

  // Handle form submission
  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  // Handle "Add More" submission
  const handleOnMoreSubmit = useCallback(() => {
    if (validateForm()) {
      const updatedDate = dayjs(formState.data.date).local().add(1, "second").format("YYYY-MM-DDTHH:mm:ss");
      
      const newTransactionData: TransactionFormType = {
        ...initialTransactionState,
        date: updatedDate,
        type: formState.data.type,
        categoryid: formState.data.categoryid,
        accountid: formState.data.accountid,
      };
      
      submit(formState.data).then(() => {
        setFormData(newTransactionData);
      });
    }
  }, [validateForm, submit, formState.data, setFormData]);

  // Update form data when transaction prop changes
  useEffect(() => {
    const initialMode = transaction.amount && transaction.amount < 0 ? 'minus' : 'plus';
    setMode(initialMode);
    setFormData({
      ...transaction,
      amount: Math.abs(transaction.amount ?? 0),
      mode: initialMode,
    });
  }, [transaction, setFormData]);

  // Handle mode changes
  const handleModeToggle = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    const newMode = mode === 'plus' ? 'minus' : 'plus';
    setMode(newMode);
    updateField('mode', newMode);
  }, [mode, updateField]);

  // Enhanced transaction type change handling
  const handleTypeChange = useCallback((type: string) => {
    const typeConfig = TRANSACTION_TYPE_CONFIG[type as keyof typeof TRANSACTION_TYPE_CONFIG];
    
    if (!typeConfig) {
      console.warn(`Unknown transaction type: ${type}`);
      return;
    }

    // Update type and mode
    updateField('type', type);
    setMode(typeConfig.mode);
    updateField('mode', typeConfig.mode);

    // Set default name if current name is empty or matches previous type
    if (!formState.data.name || Object.values(TRANSACTION_TYPE_CONFIG).some(config => 
      formState.data.name === config.defaultName
    )) {
      updateField('name', typeConfig.defaultName);
    }

    // Handle transfer-specific logic
    if (type === "Transfer") {
      // Clear payee for transfers
      updateField('payee', '');
      
      // Find and set transfer category
      const transferCategory = categories?.find(category => 
        category.name?.toLowerCase().includes("transfer") || 
        category.name?.toLowerCase().includes("account")
      );
      if (transferCategory) {
        updateField('categoryid', transferCategory.id);
      }
    } else {
      // Clear transfer account for non-transfers
      updateField('transferaccountid', null);
    }
  }, [updateField, categories, formState.data.name]);

  // Enhanced account switching for transfers with validation
  const handleSwitchAccounts = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    
    const currentAccountId = formState.data.accountid;
    const currentTransferAccountId = formState.data.transferaccountid;
    
    // Only switch if both accounts are selected
    if (currentAccountId && currentTransferAccountId) {
      updateField('accountid', currentTransferAccountId);
      updateField('transferaccountid', currentAccountId);
    } else if (currentAccountId && !currentTransferAccountId) {
      // If only source account is selected, clear it and wait for user to select destination
      updateField('accountid', '');
    }
  }, [formState.data.accountid, formState.data.transferaccountid, updateField]);

  // Enhanced searchable dropdown selection with better data handling
  const onSelectItem = useCallback((item: SearchableDropdownItem) => {
    const selectedTransaction = item.item;
    
    // Determine mode based on transaction type and amount
    let selectedMode: 'plus' | 'minus' = 'minus';
    if (selectedTransaction.type === 'Income') {
      selectedMode = 'plus';
    } else if (selectedTransaction.type === 'Transfer' || selectedTransaction.type === 'Expense') {
      selectedMode = 'minus';
    } else {
      selectedMode = selectedTransaction.amount < 0 ? 'minus' : 'plus';
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
  }, [setFormData, transaction.id, formState.data.date]);

  // Enhanced amount change handling with better validation
  const handleAmountChange = useCallback((value: string) => {
    // Clean and validate the input
    let cleanValue = value
      .replace(/[^0-9.-]/g, "") // Allow only digits, minus sign, and decimal point
      .replace(/(?!^)-/g, "") // Remove any minus sign that isn't at the start
      .replace(/\.{2,}/g, ".") // Replace multiple decimal points with single
      .replace(/^0+(?=\d)/, ""); // Remove leading zeros

    // Handle negative input (changes mode)
    if (cleanValue.startsWith("-")) {
      // Only allow mode change for non-transfer transactions
      if (formState.data.type !== 'Transfer' && formState.data.type !== 'Income') {
        setMode("minus");
        updateField('mode', 'minus');
      }
      cleanValue = cleanValue.replace("-", "");
    }

    // Ensure only one decimal point
    const decimalIndex = cleanValue.indexOf('.');
    if (decimalIndex !== -1) {
      const beforeDecimal = cleanValue.substring(0, decimalIndex);
      const afterDecimal = cleanValue.substring(decimalIndex + 1).replace(/\./g, '');
      cleanValue = beforeDecimal + '.' + afterDecimal;
    }

    // Limit decimal places to 2
    if (cleanValue.includes('.')) {
      const parts = cleanValue.split('.');
      if (parts[1] && parts[1].length > 2) {
        cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }

    const numericAmount = parseFloat(cleanValue) || 0;
    
    // Validate maximum amount
    if (numericAmount > 999999999.99) {
      return; // Don't update if amount is too large
    }

    updateField('amount', numericAmount);
  }, [updateField, formState.data.type]);

  // Enhanced calculator result handling
  const handleCalculatorResult = useCallback((result: string) => {
    const numericResult = parseFloat(result);
    
    if (isNaN(numericResult) || !isFinite(numericResult)) {
      console.warn('Invalid calculator result:', result);
      return;
    }

    const amount = Math.abs(numericResult);
    
    // Validate maximum amount
    if (amount > 999999999.99) {
      console.warn('Calculator result exceeds maximum amount');
      return;
    }

    // Round to 2 decimal places
    const roundedAmount = Math.round(amount * 100) / 100;
    updateField('amount', roundedAmount);
  }, [updateField]);

  // Enhanced dropdown options with better filtering and sorting
  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    
    return categories
      .filter(item => item.name) // Filter out categories without names
      .map(item => ({
        id: item.id,
        label: item.name || '',
        value: item.id,
        icon: item.icon,
        color: item.color,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [categories]);

  const accountOptions = useMemo(() => {
    if (!accounts) return [];
    
    return accounts
      .filter(item => item.name) // Filter out accounts without names
      .map(item => ({
        id: item.id,
        label: item.name || '',
        value: item.id,
        group: item.categoryname || 'Other',
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

  const transactionTypeOptions: OptionItem[] = [
    { id: 'income', label: 'Income', value: 'Income' },
    { id: 'expense', label: 'Expense', value: 'Expense' },
    { id: 'transfer', label: 'Transfer', value: 'Transfer' },
  ];

  const isEdit = !!transaction.id;
  const isLoading = isSubmitting || isCategoriesLoading || isAccountLoading;

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
          {/* Add More Button */}
          <View className="flex-row justify-end mb-4">
            <Pressable
              className="flex-row items-center px-3 py-2 bg-primary-100 rounded-md"
              disabled={isLoading}
              onPress={handleOnMoreSubmit}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save and add another transaction"
            >
              <MyIcon name="Plus" size={20} className="text-primary-600 mr-1" />
              <Text className="text-primary-600 font-medium">Add More</Text>
            </Pressable>
          </View>

          {/* Basic Information Section */}
          <FormSection title="Transaction Details" description="Enter the transaction's basic information">
            <SearchableDropdown
              label="Name"
              searchAction={getTransactionsByName}
              initalValue={formState.data.name}
              onSelectItem={onSelectItem}
              onChange={(val) => updateField('name', val)}
            />

            {formState.data.type !== "Transfer" && (
              <FormField
                config={{
                  name: 'payee',
                  label: 'Payee',
                  type: 'text',
                  placeholder: 'Enter payee name',
                  required: TRANSACTION_TYPE_CONFIG[formState.data.type as keyof typeof TRANSACTION_TYPE_CONFIG]?.requiresPayee,
                }}
                value={formState.data.payee}
                error={formState.errors.payee}
                touched={formState.touched.payee}
                onChange={(value) => updateField('payee', value)}
                onBlur={() => setFieldTouched('payee')}
              />
            )}

            <FormField
              config={{
                name: 'date',
                label: 'Date',
                type: 'date',
                required: true,
              }}
              value={formState.data.date}
              error={formState.errors.date}
              touched={formState.touched.date}
              onChange={(value) => {
                if (value) {
                  const formattedDate = dayjs(value).local().format("YYYY-MM-DDTHH:mm:ss");
                  updateField('date', formattedDate);
                }
              }}
              onBlur={() => setFieldTouched('date')}
            />
          </FormSection>

          {/* Amount and Type Section */}
          <FormSection title="Amount & Type" description="Set the transaction amount and type">
            <View className="flex-row justify-center items-center mb-4">
              <Pressable
                className={`${
                  formState.data.type === "Transfer" 
                    ? "bg-info-400" 
                    : mode === "plus" 
                      ? "bg-success-400" 
                      : "bg-danger-400"
                } border border-muted rounded-lg me-2 p-1.5`}
                onPress={handleModeToggle}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Toggle amount sign, currently ${mode}`}
              >
                {mode === "minus" ? (
                  <MyIcon name="Minus" size={24} className="text-gray-100" />
                ) : (
                  <MyIcon name="Plus" size={24} className="text-gray-100" />
                )}
              </Pressable>

              <View className="flex-1">
                <FormField
                  config={{
                    name: 'amount',
                    label: 'Amount',
                    type: 'number',
                    required: true,
                    placeholder: '0.00',
                  }}
                  value={formState.data.amount?.toString()}
                  error={formState.errors.amount}
                  touched={formState.touched.amount}
                  onChange={handleAmountChange}
                />
              </View>

              <CalculatorComponent
                onSubmit={handleCalculatorResult}
                currentValue={formState.data.amount}
              />
            </View>

            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} z-30`}>
              <FormField
                config={{
                  name: 'categoryid',
                  label: 'Category',
                  type: 'select',
                  required: true,
                  options: categoryOptions,
                }}
                value={formState.data.categoryid}
                error={formState.errors.categoryid}
                touched={formState.touched.categoryid}
                onChange={(value) => updateField('categoryid', value)}
                onBlur={() => setFieldTouched('categoryid')}
              />

              <FormField
                config={{
                  name: 'type',
                  label: 'Type',
                  type: 'select',
                  required: true,
                  options: transactionTypeOptions,
                }}
                value={formState.data.type}
                error={formState.errors.type}
                touched={formState.touched.type}
                onChange={handleTypeChange}
                onBlur={() => setFieldTouched('type')}
              />
            </View>
          </FormSection>

          {/* Account Information Section */}
          <FormSection title="Account Information" description="Select the accounts for this transaction">
            <View className={`${Platform.OS === "web" ? "flex flex-row items-center" : ""} z-20`}>
              <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                <FormField
                  config={{
                    name: 'accountid',
                    label: 'Account',
                    type: 'select',
                    required: true,
                    options: accountOptions,
                  }}
                  value={formState.data.accountid}
                  error={formState.errors.accountid}
                  touched={formState.touched.accountid}
                  onChange={(value) => updateField('accountid', value)}
                  onBlur={() => setFieldTouched('accountid')}
                />
              </View>

              {formState.data.type === "Transfer" && (
                <>
                  <Pressable
                    onPress={handleSwitchAccounts}
                    className={`p-2 ${Platform.OS === "web" ? "mx-2" : "my-2 self-center"}`}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Switch source and destination accounts"
                  >
                    <MyIcon name="ArrowUpDown" size={24} className="text-primary-300" />
                  </Pressable>

                  <View className={`${Platform.OS === "web" ? "flex-1" : ""}`}>
                    <FormField
                      config={{
                        name: 'transferaccountid',
                        label: 'Destination Account',
                        type: 'select',
                        required: true,
                        options: transferAccountOptions,
                        description: 'Select the account to transfer money to',
                      }}
                      value={formState.data.transferaccountid}
                      error={formState.errors.transferaccountid}
                      touched={formState.touched.transferaccountid}
                      onChange={(value) => updateField('transferaccountid', value)}
                      onBlur={() => setFieldTouched('transferaccountid')}
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
                  name: 'tags',
                  label: 'Tags',
                  type: 'multiselect',
                  placeholder: 'Enter tags separated by commas',
                  description: 'Add tags to categorize and search transactions',
                }}
                value={formState.data.tags}
                error={formState.errors.tags}
                touched={formState.touched.tags}
                onChange={(value) => updateField('tags', Array.isArray(value) ? value : value?.split(',').filter(Boolean))}
                onBlur={() => setFieldTouched('tags')}
                className="flex-1"
              />

              <FormField
                config={{
                  name: 'notes',
                  label: 'Notes',
                  type: 'textarea',
                  placeholder: 'Enter any additional notes',
                  description: 'Optional notes about this transaction',
                }}
                value={formState.data.notes}
                error={formState.errors.notes}
                touched={formState.touched.notes}
                onChange={(value) => updateField('notes', value)}
                onBlur={() => setFieldTouched('notes')}
                className="flex-1"
              />
            </View>
          </FormSection>

          {/* Display submission error if any */}
          {error && (
            <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-700 text-sm">
                Error: {error.message}
              </Text>
            </View>
          )}
        </FormContainer>
      </ScrollView>
    </SafeAreaView>
  );
}


