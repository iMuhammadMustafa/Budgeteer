import { memo, useCallback, useMemo } from "react";
import { ScrollView, View } from "react-native";

import { ColorsPickerDropdown } from "@/src/components/elements/dropdown/DropdownField";
import IconPicker from "@/src/components/elements/IconPicker";
import FormContainer from "@/src/components/form-builder/FormContainer";
import FormField from "@/src/components/form-builder/FormField";
import FormSection from "@/src/components/form-builder/FormSection";
import { useFormState } from "@/src/components/form-builder/hooks/useFormState";
import { useFormSubmission } from "@/src/components/form-builder/hooks/useFormSubmission";
import { useSavingsBucketService } from "@/src/services/SavingsBuckets.Service";
import { ValidationSchema } from "@/src/types/components/forms.types";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, SavingsBucket, Updates } from "@/src/types/database/Tables.Types";
import { commonValidationRules } from "@/src/utils/form-validation";
import { SafeAreaView } from "react-native-safe-area-context";

export type SavingsBucketFormType = Inserts<TableNames.SavingsBuckets> | Updates<TableNames.SavingsBuckets>;

interface SavingsBucketFormProps {
  bucket: SavingsBucketFormType;
  accountId: string;
  onSuccess?: (saved: SavingsBucket | null | undefined) => void;
  onCancel?: () => void;
}

interface SavingsBucketFormData {
  name: string;
  targetamount: number;
  currentamount: number;
  icon: string;
  color: string;
  displayorder: number;
  accountid: string;
  id?: string;
  tenantid?: string;
  isdeleted?: boolean;
  createdby?: string | null;
  updatedby?: string | null;
}

export const initialBucketState: SavingsBucketFormData = {
  name: "",
  targetamount: 0,
  currentamount: 0,
  icon: "PiggyBank",
  color: "primary-100",
  displayorder: 0,
  accountid: "",
};

const validationSchema: ValidationSchema<SavingsBucketFormData> = {
  name: [commonValidationRules.required("Bucket name is required")],
  targetamount: [commonValidationRules.min(0, "Target amount must be 0 or greater")],
  currentamount: [commonValidationRules.min(0, "Current amount must be 0 or greater")],
};

function SavingsBucketFormComponent({ bucket, accountId, onSuccess, onCancel }: SavingsBucketFormProps) {
  const bucketService = useSavingsBucketService();
  const { mutate: upsertBucket } = bucketService.useUpsertBucket();

  const initialFormData: SavingsBucketFormData = useMemo(
    () => ({
      name: bucket.name || "",
      targetamount: bucket.targetamount ?? 0,
      currentamount: bucket.currentamount ?? 0,
      icon: bucket.icon || "PiggyBank",
      color: bucket.color || "primary-100",
      displayorder: bucket.displayorder ?? 0,
      accountid: bucket.accountid || accountId,
      ...(bucket.id && { id: bucket.id }),
      ...(bucket.tenantid && { tenantid: bucket.tenantid }),
    }),
    [bucket, accountId],
  );

  const { formState, updateField, validateForm, resetForm, isValid, isDirty } = useFormState(
    initialFormData,
    validationSchema,
  );

  const handleSubmit = useCallback(
    async (data: SavingsBucketFormData) => {
      await new Promise<void>((resolve, reject) => {
        upsertBucket(
          {
            form: data as Inserts<TableNames.SavingsBuckets> | Updates<TableNames.SavingsBuckets>,
            original: bucket as SavingsBucket,
          },
          {
            onSuccess: savedData => {
              if (onSuccess) onSuccess(savedData);
              resolve();
            },
            onError: error => {
              console.error("Error saving bucket:", error);
              reject(error);
            },
          },
        );
      });
    },
    [upsertBucket, bucket, onSuccess],
  );

  const { submit, isSubmitting } = useFormSubmission(handleSubmit);

  const onSubmit = useCallback(() => {
    if (validateForm()) {
      submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  const handleIconSelect = useCallback(
    (icon: string) => {
      updateField("icon", icon);
    },
    [updateField],
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        <FormContainer
          onSubmit={onSubmit}
          isValid={isValid && !isSubmitting}
          isLoading={isSubmitting}
          submitLabel="Save Bucket"
          showReset={isDirty}
          onReset={resetForm}
        >
          <FormSection title="Bucket Details" description="Configure your savings bucket">
            <FormField
              config={{
                name: "name",
                label: "Bucket Name",
                type: "text",
                required: true,
                placeholder: "e.g., Emergency Fund",
              }}
              value={formState.data.name}
              error={formState.errors.name}
              touched={formState.touched.name}
              onChange={value => updateField("name", value)}
              onBlur={() => updateField("name", formState.data.name)}
            />

            <FormField
              config={{
                name: "targetamount",
                label: "Target Amount",
                type: "number",
                placeholder: "0.00",
              }}
              value={formState.data.targetamount}
              error={formState.errors.targetamount}
              touched={formState.touched.targetamount}
              onChange={value => updateField("targetamount", Number(value) || 0)}
            />

            <FormField
              config={{
                name: "currentamount",
                label: "Current Amount",
                type: "number",
                placeholder: "0.00",
              }}
              value={formState.data.currentamount}
              error={formState.errors.currentamount}
              touched={formState.touched.currentamount}
              onChange={value => updateField("currentamount", Number(value) || 0)}
            />

            <FormField
              config={{
                name: "displayorder",
                label: "Display Order",
                type: "number",
                placeholder: "0",
              }}
              value={formState.data.displayorder}
              error={formState.errors.displayorder}
              touched={formState.touched.displayorder}
              onChange={value => updateField("displayorder", Number(value) || 0)}
            />
          </FormSection>

          <FormSection title="Appearance">
            <View className="flex-row items-center gap-4">
              <IconPicker selectedIcon={formState.data.icon} onSelectIcon={handleIconSelect} />
              <View className="flex-1">
                <ColorsPickerDropdown
                  value={formState.data.color}
                  onChange={value => updateField("color", value)}
                />
              </View>
            </View>
          </FormSection>
        </FormContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const SavingsBucketForm = memo(SavingsBucketFormComponent);
export default SavingsBucketForm;
