// ConfigurationForm.tsx
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import TextInputField from "../TextInputField";
import Button from "../Button";
import { Inserts, Updates } from "@/src/types/db/Tables.Types";
import { useConfigurationService } from "@/src/services/Configurations.Service";

export type ConfigurationFormType = {
  id?: string;
  table: string;
  type: string;
  key: string;
  value: string;
};

export const initialState: ConfigurationFormType = {
  table: "",
  type: "",
  key: "",
  value: "",
};

export default function ConfigurationForm({
  configuration,
  onSuccess,
}: {
  configuration?: ConfigurationFormType;
  onSuccess?: () => void;
}) {
  const [formData, setFormData] = useState<ConfigurationFormType>(configuration || initialState);
  const configService = useConfigurationService();
  const { mutate, isPending } = configService.upsert();

  useEffect(() => {
    if (configuration) setFormData(configuration);
  }, [configuration]);

  const handleChange = (name: keyof ConfigurationFormType, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    mutate(
      { form: formData },
      {
        onSuccess: () => {
          onSuccess && onSuccess();
        },
      },
    );
  };

  return (
    <View className="p-5">
      <TextInputField label="Table" value={formData.table} onChange={text => handleChange("table", text)} />
      <TextInputField label="Type" value={formData.type} onChange={text => handleChange("type", text)} />
      <TextInputField label="Key" value={formData.key} onChange={text => handleChange("key", text)} />
      <TextInputField label="Value" value={formData.value} onChange={text => handleChange("value", text)} />
      <Button
        label={isPending ? "Saving..." : "Save"}
        onPress={handleSubmit}
        isValid={!!formData.table && !!formData.type && !!formData.key && !!formData.value}
      />
    </View>
  );
}
