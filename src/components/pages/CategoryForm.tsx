import { useCallback, useEffect, useState } from "react";
import { Inserts, Updates } from "../../lib/supabase";
import { useUpsertCategory } from "../../repositories/categories.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import { SafeAreaView, ScrollView } from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import IconPicker from "../IconPicker";
import { TableNames } from "../../consts/TableNames";

export type CategoryFormType = Inserts<TableNames.Categories> | Updates<TableNames.Categories>;

export default function CategoryForm({ category }: { category: CategoryFormType }) {
  const [formData, setFormData] = useState<CategoryFormType>(category);
  const [isLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertCategory();
  const { addNotification } = useNotifications();

  const handleIconSelect = useCallback((icon: string) => {
    setFormData(prevFormData => ({ ...prevFormData, icon }));
  }, []);

  const handleTextChange = (name: keyof CategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />
        <TextInputField label="Type" value={formData.type} onChange={text => handleTextChange("type", text)} />

        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />
        <IconPicker onSelect={handleIconSelect} initialIcon={formData.icon} />

        <Button
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
            mutate(formData, {
              onSuccess: () => {
                addNotification({ message: "Category Created Successfully", type: "success" });
                router.replace("/Categories");
              },
            });
          }}
        >
          {isLoading ? <ButtonSpinner /> : <ButtonText className="font-medium text-sm ml-2">Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
