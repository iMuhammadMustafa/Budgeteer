// ConfigurationForm.tsx - Refactored to use new form system
import React, { useMemo } from "react";
import { View } from "react-native";
import { useUpsertConfiguration } from "@/src/services/repositories/Configurations.Service";
import { useFormState } from "../hooks/useFormState";
import { useFormSubmission } from "../hooks/useFormSubmission";
import FormContainer from "./FormContainer";
import FormField from "./FormField";
import { 
  ConfigurationFormData, 
  ValidationSchema, 
  FormFieldConfig 
} from "@/src/types/components/forms.types";
import { commonValidationRules } from "@/src/utils/form-validation";

export type ConfigurationFormType = ConfigurationFormData;

export const initialState: ConfigurationFormType = {
  table: "",
  type: "",
  key: "",
  value: "",
};

// Validation schema for configuration form
const validationSchema: ValidationSchema<ConfigurationFormType> = {
  table: [
    commonValidationRules.required('Table name is required'),
    commonValidationRules.minLength(2, 'Table name must be at least 2 characters'),
    commonValidationRules.maxLength(50, 'Table name must be no more than 50 characters'),
  ],
  type: [
    commonValidationRules.required('Type is required'),
    commonValidationRules.minLength(2, 'Type must be at least 2 characters'),
    commonValidationRules.maxLength(50, 'Type must be no more than 50 characters'),
  ],
  key: [
    commonValidationRules.required('Key is required'),
    commonValidationRules.minLength(2, 'Key must be at least 2 characters'),
    commonValidationRules.maxLength(100, 'Key must be no more than 100 characters'),
  ],
  value: [
    commonValidationRules.required('Value is required'),
    commonValidationRules.maxLength(500, 'Value must be no more than 500 characters'),
  ],
};

// Field configurations
const fieldConfigs: FormFieldConfig<ConfigurationFormType>[] = [
  {
    name: 'table',
    label: 'Table',
    type: 'text',
    required: true,
    placeholder: 'Enter table name',
    description: 'The database table this configuration applies to',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'text',
    required: true,
    placeholder: 'Enter configuration type',
    description: 'The type or category of this configuration',
  },
  {
    name: 'key',
    label: 'Key',
    type: 'text',
    required: true,
    placeholder: 'Enter configuration key',
    description: 'The unique identifier for this configuration setting',
  },
  {
    name: 'value',
    label: 'Value',
    type: 'textarea',
    required: true,
    placeholder: 'Enter configuration value',
    description: 'The value for this configuration setting',
  },
];

interface ConfigurationFormProps {
  configuration?: ConfigurationFormType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ConfigurationForm({
  configuration,
  onSuccess,
  onCancel,
}: ConfigurationFormProps) {
  // Initialize form data with provided configuration or default state
  const initialData = useMemo(() => 
    configuration ? { ...initialState, ...configuration } : initialState,
    [configuration]
  );

  // Form state management
  const {
    formState,
    updateField,
    setFieldTouched,
    validateForm,
    resetForm,
    isValid,
  } = useFormState(initialData, validationSchema);

  // Mutation hook for API calls
  const { mutate, isPending, error: mutationError } = useUpsertConfiguration();

  // Form submission handling
  const { submit, isSubmitting, error: submissionError } = useFormSubmission(
    async (data: ConfigurationFormType) => {
      return new Promise<void>((resolve, reject) => {
        mutate(
          { 
            formConfiguration: data,
            originalData: configuration 
          },
          {
            onSuccess: () => {
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    },
    {
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
      resetOnSuccess: false,
      showSuccessMessage: true,
      showErrorMessage: true,
    }
  );

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      await submit(formState.data);
    }
  };

  // Handle form reset
  const handleReset = () => {
    resetForm();
  };

  // Handle field changes with validation
  const handleFieldChange = (fieldName: keyof ConfigurationFormType, value: any) => {
    updateField(fieldName, value);
  };

  // Handle field blur events
  const handleFieldBlur = (fieldName: keyof ConfigurationFormType) => {
    setFieldTouched(fieldName);
  };

  // Determine loading state
  const isLoading = isPending || isSubmitting;

  // Get current error (prioritize submission error over mutation error)
  const currentError = submissionError || mutationError;

  return (
    <FormContainer
      onSubmit={handleSubmit}
      isValid={isValid}
      isLoading={isLoading}
      submitLabel={configuration?.id ? "Update Configuration" : "Create Configuration"}
      showReset={true}
      onReset={handleReset}
    >
      <View 
        className="space-y-4"
        accessible={true}
        accessibilityRole="group"
        accessibilityLabel="Configuration form fields"
      >
        {fieldConfigs.map((config) => (
          <FormField
            key={String(config.name)}
            config={config}
            value={formState.data[config.name]}
            error={formState.errors[config.name]}
            touched={formState.touched[config.name]}
            onChange={(value) => handleFieldChange(config.name, value)}
            onBlur={() => handleFieldBlur(config.name)}
          />
        ))}

        {/* Display form-level errors */}
        {currentError && (
          <View 
            className="p-3 bg-red-50 border border-red-200 rounded-md"
            accessible={true}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text className="text-red-700 text-sm">
              {currentError instanceof Error ? currentError.message : String(currentError)}
            </Text>
          </View>
        )}
      </View>
    </FormContainer>
  );
}
