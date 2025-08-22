import React, { memo, useCallback, useMemo } from "react";
import { Platform, SafeAreaView, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";

import { Inserts, TransactionGroup, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionGroupFormData, ValidationSchema, FormFieldConfig } from "@/src/types/components/forms.types";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import {
  commonValidationRules,
  createCategoryNameValidation,
  createDescriptionValidation,
} from "@/src/utils/form-validation";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import FormSection from "./FormSection";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";
import Button from "../Button";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";

export type TransactionGroupFormType = Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;

export const initialState: TransactionGroupFormData = {
  name: "",
  type: "Expense",
  description: "",
  budgetamount: 0,
  budgetfrequency: "",
  icon: "CircleHelp",
  color: "info-100",
  displayorder: 0,
};

// Validation schema for TransactionGroupForm
const validationSchema: ValidationSchema<TransactionGroupFormData> = {
  name: createCategoryNameValidation(),
  type: [commonValidationRules.required("Transaction type is required")],
  description: createDescriptionValidation(false),
  budgetamount: [
    commonValidationRules.required("Budget amount is required"),
    commonValidationRules.min(0, "Budget amount must be 0 or greater"),
    commonValidationRules.max(999999999.99, "Budget amount is too large"),
  ],
  budgetfrequency: [commonValidationRules.required("Budget frequency is required")],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
  displayorder: [
    commonValidationRules.required("Display order is required"),
    commonValidationRules.min(0, "Display order must be 0 or greater"),
  ],
};

// Form field configurations
const createFormFields = (): FormFieldConfig<TransactionGroupFormData>[] => [
  {
    name: "name",
    label: "Group Name",
    type: "text",
    required: true,
    placeholder: "Enter group name",
    description: "A descriptive name for this transaction group",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Enter description (optional)",
    description: "Additional details about this transaction group",
  },
  {
    name: "type",
    label: "Transaction Type",
    type: "select",
    required: true,
    options: [
      { id: "Income", label: "Income", value: "Income" },
      { id: "Expense", label: "Expense", value: "Expense" },
      { id: "Transfer", label: "Transfer", value: "Transfer" },
      { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: true },
      { id: "Initial", label: "Initial", value: "Initial", disabled: true },
      { id: "Refund", label: "Refund", value: "Refund", disabled: true },
    ],
    description: "Choose the type of transactions this group will contain",
  },
  {
    name: "displayorder",
    label: "Display Order",
    type: "number",
    required: true,
    placeholder: "0",
    description: "Order in which this group appears in lists (lower numbers appear first)",
  },
];

// Budget field configurations
const createBudgetFields = (): FormFieldConfig<TransactionGroupFormData>[] => [
  {
    name: "budgetamount",
    label: "Budget Amount",
    type: "number",
    required: true,
    placeholder: "0.00",
    description: "The budget amount for this group",
  },
  {
    name: "budgetfrequency",
    label: "Budget Frequency",
    type: "select",
    required: true,
    options: [
      { id: "Daily", label: "Daily", value: "Daily" },
      { id: "Weekly", label: "Weekly", value: "Weekly" },
      { id: "Monthly", label: "Monthly", value: "Monthly" },
      { id: "Yearly", label: "Yearly", value: "Yearly" },
    ],
    description: "How often this budget amount applies",
  },
];

interface TransactionGroupFormProps {
  group: TransactionGroupFormType;
}

function TransactionGroupFormComponent({ group }: TransactionGroupFormProps) {
  // Initialize form data from props
  const initialFormData: TransactionGroupFormData = useMemo(
    () => ({
      ...initialState,
      ...group,
    }),
    [group],
  );

  // Form state management
  const { formState, updateField, setFieldTouched, validateForm, resetForm, isValid, isDirty } = useFormState(
    initialFormData,
    validationSchema,
  );

  // Form submission handling
  const { mutate } = useTransactionGroupService().upsert();

  const handleSubmit = useCallback(
    async (data: TransactionGroupFormData) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          {
            form: data,
            original: group as TransactionGroup,
          },
          {
            onSuccess: () => {
              console.log({ message: "Transaction Group Created Successfully", type: "success" });
              router.replace("/Categories");
              resolve();
            },
            onError: error => {
              console.error("Failed to save transaction group:", error);
              reject(error);
            },
          },
        );
      });
    },
    [mutate, group],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Transaction group saved successfully");
    },
    onError: error => {
      console.error("Form submission error:", error);
    },
  });

  // Form submission handler
  const handleFormSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  // Reset form handler
  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // Field change handlers
  const handleFieldChange = useCallback(
    (field: keyof TransactionGroupFormData, value: any) => {
      updateField(field, value);
    },
    [updateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof TransactionGroupFormData) => {
      setFieldTouched(field);
    },
    [setFieldTouched],
  );

  // Icon selection handler
  const handleIconSelect = useCallback(
    (icon: string) => {
      updateField("icon", icon);
    },
    [updateField],
  );

  // Color selection handler
  const handleColorSelect = useCallback(
    (colorOption: any) => {
      updateField("color", colorOption?.value || "info-100");
    },
    [updateField],
  );

  // Budget amount change handler with validation
  const handleBudgetAmountChange = useCallback(
    (value: string) => {
      // Allow empty string for clearing the field
      if (value === "") {
        updateField("budgetamount", 0);
        return;
      }

      // Only allow valid numeric input
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue) && isFinite(numericValue)) {
        updateField("budgetamount", numericValue);
      }
    },
    [updateField],
  );

  // Form fields configuration
  const formFields = useMemo(() => createFormFields(), []);
  const budgetFields = useMemo(() => createBudgetFields(), []);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" nestedScrollEnabled={true}>
        <FormContainer
          onSubmit={handleFormSubmit}
          isValid={isValid && !isSubmitting}
          isLoading={isSubmitting}
          submitLabel="Save Group"
          showReset={isDirty}
          onReset={handleReset}
        >
          <FormSection title="Group Details">
            {/* Render standard form fields */}
            {formFields.map(fieldConfig => (
              <FormField
                key={String(fieldConfig.name)}
                config={fieldConfig}
                value={formState.data[fieldConfig.name]}
                error={formState.errors[fieldConfig.name]}
                touched={formState.touched[fieldConfig.name]}
                onChange={value => handleFieldChange(fieldConfig.name, value)}
                onBlur={() => handleFieldBlur(fieldConfig.name)}
              />
            ))}
          </FormSection>

          <FormSection title="Budget Settings">
            {/* Budget Amount with custom handler */}
            <FormField
              config={budgetFields[0]}
              value={formState.data.budgetamount?.toString() || ""}
              error={formState.errors.budgetamount}
              touched={formState.touched.budgetamount}
              onChange={handleBudgetAmountChange}
              onBlur={() => handleFieldBlur("budgetamount")}
            />

            {/* Budget Frequency */}
            <FormField
              config={budgetFields[1]}
              value={formState.data.budgetfrequency}
              error={formState.errors.budgetfrequency}
              touched={formState.touched.budgetfrequency}
              onChange={value => handleFieldChange("budgetfrequency", value)}
              onBlur={() => handleFieldBlur("budgetfrequency")}
            />
          </FormSection>

          <FormSection title="Appearance">
            {/* Icon and Color Selection */}
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between z-10`}>
              <View className="flex-1">
                <IconPicker
                  onSelect={handleIconSelect}
                  label="Icon"
                  initialIcon={formState.data.icon ?? "CircleHelp"}
                />
              </View>
              <ColorsPickerDropdown selectedValue={formState.data.color} handleSelect={handleColorSelect} />
            </View>
          </FormSection>

          {/* Display submission error if any */}
          {error && (
            <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-700 text-sm">
                {error.message || "An error occurred while saving the transaction group"}
              </Text>
            </View>
          )}
        </FormContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
const TransactionGroupForm = memo(TransactionGroupFormComponent);

export default TransactionGroupForm;
