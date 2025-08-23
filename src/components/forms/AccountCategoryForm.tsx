import { memo, useCallback, useMemo, useEffect } from "react";
import { Platform, SafeAreaView, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { ValidationSchema, FormFieldConfig } from "@/src/types/components/forms.types";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { commonValidationRules, createCategoryNameValidation } from "@/src/utils/form-validation";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import FormSection from "./FormSection";
import { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export type AccountCategoryFormType = Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
interface AccountCategoryFormProps {
  category: AccountCategoryFormType;
}
// Define the form data type with only the fields we need for the form
interface AccountCategoryFormData {
  name: string;
  icon: string;
  color: string;
  displayorder: number;
  type: "Asset" | "Liability";
  // Optional fields that might come from existing data
  id?: string;
  tenantid?: string;
  isdeleted?: boolean;
  createdby?: string;
  updatedby?: string;
}

export const initialState: AccountCategoryFormData = {
  name: "",
  icon: "CircleHelp",
  color: "info-100",
  displayorder: 0,
  type: "Asset",
};

// Validation schema for AccountCategoryForm
const validationSchema: ValidationSchema<AccountCategoryFormData> = {
  name: createCategoryNameValidation(),
  type: [commonValidationRules.required("Account type is required")],
  icon: [commonValidationRules.required("Icon is required")],
  color: [commonValidationRules.required("Color is required")],
  displayorder: [
    commonValidationRules.required("Display order is required"),
    commonValidationRules.min(0, "Display order must be 0 or greater"),
  ],
};

// Form field configurations
const createFormFields = (): FormFieldConfig<AccountCategoryFormData>[] => [
  {
    name: "name",
    label: "Category Name",
    type: "text",
    required: true,
    placeholder: "Enter category name",
    description: "A descriptive name for this account category",
  },
  {
    name: "type",
    label: "Account Type",
    type: "select",
    required: true,
    options: [
      { id: "Asset", label: "Asset", value: "Asset" },
      { id: "Liability", label: "Liability", value: "Liability" },
    ],
    description: "Choose whether this category represents assets or liabilities",
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

function AccountCategoryFormComponent({ category }: AccountCategoryFormProps) {
  // Initialize form data from props
  const initialFormData: AccountCategoryFormData = useMemo(() => {
    const formData = {
      name: category.name || "",
      icon: category.icon || "CircleHelp",
      color: category.color || "info-100",
      displayorder: category.displayorder ?? 0,
      type: (category.type as "Asset" | "Liability") || "Asset",
      // Include optional fields if they exist
      ...(category.id && { id: category.id }),
      ...(category.tenantid && { tenantid: category.tenantid }),
      ...(category.isdeleted !== undefined && { isdeleted: category.isdeleted }),
      ...(category.createdby && { createdby: category.createdby }),
      ...(category.updatedby && { updatedby: category.updatedby }),
    };
    return formData;
  }, [category]);

  // Form state management
  const { formState, updateField, setFieldTouched, validateForm, resetForm, setFormData, isValid, isDirty } =
    useFormState(initialFormData, validationSchema);

  // Update form data when category changes (for edit mode)
  // useEffect(() => {
  //   setFormData(formState);
  // }, [formState]);

  // Form submission handling
  const { mutate } = useAccountCategoryService().upsert();

  const handleSubmit = useCallback(
    async (data: AccountCategoryFormData) => {
      await new Promise<void>((resolve, reject) => {
        mutate(
          {
            form: data,
            original: category as AccountCategory,
          },
          {
            onSuccess: () => {
              console.log({ message: "Category Created Successfully", type: "success" });
              router.replace("/Accounts");
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
      console.log("Account category saved successfully");
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
    (field: keyof AccountCategoryFormData, value: any) => {
      updateField(field, value);
    },
    [updateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof AccountCategoryFormData) => {
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

  // Form fields configuration
  const formFields = useMemo(() => createFormFields(), []);

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
          <FormSection title="Category Details">
            {/* Render standard form fields */}
            {formFields.map(fieldConfig => (
              <FormField<AccountCategoryFormData>
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
const AccountCategoryForm = memo(AccountCategoryFormComponent);

export default AccountCategoryForm;
