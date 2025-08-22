import React, { memo, useCallback, useMemo } from "react";
import { Platform, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionCategory, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionCategoryFormData, ValidationSchema, FormFieldConfig } from "@/src/types/components/forms.types";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { commonValidationRules, createCategoryNameValidation, createDescriptionValidation } from "@/src/utils/form-validation";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import FormSection from "./FormSection";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import { useTransactionGroupService } from "@/src/services/TransactionGroups.Service";
import { useTransactionCategoryService } from "@/src/services/TransactionCategories.Service";

export type TransactionCategoryFormType =
  | Inserts<TableNames.TransactionCategories>
  | Updates<TableNames.TransactionCategories>;

export const initialState: TransactionCategoryFormData = {
  name: "",
  description: "",
  budgetamount: 0,
  budgetfrequency: "",
  icon: "CircleHelp",
  color: "info-100",
  displayorder: 0,
  groupid: "",
};

// Validation schema for TransactionCategoryForm
const validationSchema: ValidationSchema<TransactionCategoryFormData> = {
  name: createCategoryNameValidation(),
  groupid: [commonValidationRules.required("Transaction group is required")],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
  budgetamount: [
    commonValidationRules.required("Budget amount is required"),
    commonValidationRules.min(0, "Budget amount must be 0 or greater"),
    commonValidationRules.max(999999999.99, "Budget amount is too large"),
  ],
  budgetfrequency: [commonValidationRules.required("Budget frequency is required")],
  description: createDescriptionValidation(false),
  displayorder: [
    commonValidationRules.required("Display order is required"),
    commonValidationRules.min(0, "Display order must be 0 or greater"),
  ],
};

// Form field configurations
const createFormFields = (groupOptions: any[]): FormFieldConfig<TransactionCategoryFormData>[] => [
  {
    name: "name",
    label: "Category Name",
    type: "text",
    required: true,
    placeholder: "Enter category name",
    description: "A descriptive name for this transaction category",
  },
  {
    name: "groupid",
    label: "Transaction Group",
    type: "select",
    required: true,
    options: groupOptions,
    description: "Select the transaction group this category belongs to",
  },
  {
    name: "budgetamount",
    label: "Budget Amount",
    type: "number",
    required: true,
    placeholder: "0.00",
    description: "The budgeted amount for this category",
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
  {
    name: "description",
    label: "Description",
    type: "textarea",
    required: false,
    placeholder: "Optional description",
    description: "Additional details about this category",
  },
  {
    name: "displayorder",
    label: "Display Order",
    type: "number",
    required: true,
    placeholder: "0",
    description: "Order in which this category appears in lists (lower numbers appear first)",
  },
];

interface TransactionCategoryFormProps {
  category: TransactionCategoryFormType;
}

function TransactionCategoryFormComponent({ category }: TransactionCategoryFormProps) {
  // Services
  const transactionCategoryService = useTransactionCategoryService();
  const transactionGroupService = useTransactionGroupService();

  // Load transaction groups
  const { data: categoryGroups, isLoading: isGroupsLoading } = transactionGroupService.findAll();

  // Initialize form data from props
  const initialFormData: TransactionCategoryFormData = useMemo(
    () => ({
      ...initialState,
      ...category,
    }),
    [category],
  );

  // Form state management
  const { formState, updateField, setFieldTouched, validateForm, resetForm, isValid, isDirty } = useFormState(
    initialFormData,
    validationSchema,
  );

  // Form submission handling
  const { mutate } = transactionCategoryService.upsert();

  const handleSubmit = useCallback(
    async (data: TransactionCategoryFormData) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          {
            form: data,
            original: category as TransactionCategory,
          },
          {
            onSuccess: () => {
              console.log({ message: "Category Created Successfully", type: "success" });
              router.replace("/Categories");
              resolve();
            },
            onError: error => {
              console.error("Failed to save category:", error);
              reject(error);
            },
          },
        );
      });
    },
    [mutate, category],
  );

  const { submit, isSubmitting, error } = useFormSubmission(handleSubmit, {
    onSuccess: () => {
      console.log("Transaction category saved successfully");
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
    (field: keyof TransactionCategoryFormData, value: any) => {
      updateField(field, value);
    },
    [updateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof TransactionCategoryFormData) => {
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

  // Prepare group options for dropdown
  const groupOptions = useMemo(() => {
    return (
      categoryGroups?.map(item => ({
        id: item.id,
        label: item.name,
        value: item.id,
        icon: item.icon,
        group: item.type,
      })) ?? []
    );
  }, [categoryGroups]);

  // Form fields configuration
  const formFields = useMemo(() => createFormFields(groupOptions), [groupOptions]);

  // Show loading state while groups are loading
  if (isGroupsLoading) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading transaction groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" nestedScrollEnabled={true}>
        <FormContainer
          onSubmit={handleFormSubmit}
          isValid={isValid && !isSubmitting}
          isLoading={isSubmitting}
          submitLabel="Save Category"
          showReset={isDirty}
          onReset={handleReset}
        >
          <FormSection title="Category Details" description="Basic information about the transaction category">
            {/* Name field */}
            <FormField
              config={formFields[0]}
              value={formState.data.name}
              error={formState.errors.name}
              touched={formState.touched.name}
              onChange={value => handleFieldChange("name", value)}
              onBlur={() => handleFieldBlur("name")}
            />

            {/* Group selection with custom dropdown */}
            <View className="my-2">
              <Text className="text-foreground mb-1 font-medium">
                Transaction Group <Text className="text-red-500 ml-1">*</Text>
              </Text>
              <DropdownField
                isModal={Platform.OS !== "web"}
                label=""
                options={groupOptions}
                selectedValue={formState.data.groupid}
                groupBy="type"
                onSelect={value => {
                  handleFieldChange("groupid", value?.value);
                  handleFieldBlur("groupid");
                }}
              />
              {formState.touched.groupid && formState.errors.groupid && (
                <Text className="text-red-500 text-sm mt-1">{formState.errors.groupid}</Text>
              )}
              <Text className="text-gray-600 text-sm mt-1">
                Select the transaction group this category belongs to
              </Text>
            </View>

            {/* Description field */}
            <FormField
              config={formFields[4]}
              value={formState.data.description}
              error={formState.errors.description}
              touched={formState.touched.description}
              onChange={value => handleFieldChange("description", value)}
              onBlur={() => handleFieldBlur("description")}
            />
          </FormSection>

          <FormSection title="Budget Settings" description="Configure budget amounts and frequency">
            {/* Budget Amount and Frequency in responsive layout */}
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-start justify-between`}>
              <View className={Platform.OS === "web" ? "flex-1" : "w-full mb-2"}>
                <FormField
                  config={formFields[2]}
                  value={formState.data.budgetamount}
                  error={formState.errors.budgetamount}
                  touched={formState.touched.budgetamount}
                  onChange={value => {
                    // Only allow numeric input
                    const numericValue = parseFloat(value) || 0;
                    handleFieldChange("budgetamount", numericValue);
                  }}
                  onBlur={() => handleFieldBlur("budgetamount")}
                />
              </View>
              <View className={Platform.OS === "web" ? "flex-1" : "w-full"}>
                <FormField
                  config={formFields[3]}
                  value={formState.data.budgetfrequency}
                  error={formState.errors.budgetfrequency}
                  touched={formState.touched.budgetfrequency}
                  onChange={value => handleFieldChange("budgetfrequency", value)}
                  onBlur={() => handleFieldBlur("budgetfrequency")}
                />
              </View>
            </View>
          </FormSection>

          <FormSection title="Appearance" description="Customize the visual appearance of this category">
            {/* Icon and Color Selection in responsive layout */}
            <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between z-10`}>
              <View className="flex-1">
                <IconPicker
                  onSelect={handleIconSelect}
                  label="Icon"
                  initialIcon={formState.data.icon ?? "CircleHelp"}
                />
                {formState.touched.icon && formState.errors.icon && (
                  <Text className="text-red-500 text-sm mt-1">{formState.errors.icon}</Text>
                )}
              </View>
              <View>
                <ColorsPickerDropdown 
                  selectedValue={formState.data.color} 
                  handleSelect={handleColorSelect} 
                />
                {formState.touched.color && formState.errors.color && (
                  <Text className="text-red-500 text-sm mt-1">{formState.errors.color}</Text>
                )}
              </View>
            </View>

            {/* Display Order */}
            <FormField
              config={formFields[5]}
              value={formState.data.displayorder}
              error={formState.errors.displayorder}
              touched={formState.touched.displayorder}
              onChange={value => {
                const numericValue = parseInt(value) || 0;
                handleFieldChange("displayorder", numericValue);
              }}
              onBlur={() => handleFieldBlur("displayorder")}
            />
          </FormSection>

          {/* Display submission error if any */}
          {error && (
            <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text className="text-red-700 text-sm">
                {error.message || "An error occurred while saving the category"}
              </Text>
            </View>
          )}
        </FormContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

// Memoize the component to prevent unnecessary re-renders
const TransactionCategoryForm = memo(TransactionCategoryFormComponent);

export default TransactionCategoryForm;
