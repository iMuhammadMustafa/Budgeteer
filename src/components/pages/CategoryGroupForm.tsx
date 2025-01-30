import { useEffect, useState } from "react";
import { Inserts, Updates } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import { Platform, SafeAreaView, ScrollView } from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { TableNames } from "../../consts/TableNames";
import MyDropDown from "../MyDropdown";
import IconPicker from "../IconPicker";
import { useUpsertCategoryGroup } from "@/src/repositories/categorygroups.service";

export type CategoryGroupFormType = Inserts<TableNames.CategoryGroups> | Updates<TableNames.CategoryGroups>;

export default function CategoryGroupForm({ category }: { category: CategoryGroupFormType }) {
  const [formData, setFormData] = useState<CategoryGroupFormType>(category);
  const [isLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertCategoryGroup();
  const { addNotification } = useNotifications();

  const handleTextChange = (name: keyof CategoryGroupFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />
        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />

        <MyDropDown
          isModal={Platform.OS !== "web"}
          label="Type"
          options={[
            { id: "Income", label: "Income", value: "Income" },
            { id: "Expense", label: "Expense", value: "Expense" },
            { id: "Transfer", label: "Transfer", value: "Transfer" },
            { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: true },
            { id: "Initial", label: "Initial", value: "Initial", disabled: true },
            { id: "Refund", label: "Refund", value: "Refund", disabled: true },
          ]}
          selectedValue={formData.type}
          onSelect={value => {
            handleTextChange("type", value?.value);
          }}
        />

        <IconPicker
          onSelect={(icon: any) => setFormData(prevFormData => ({ ...prevFormData, icon }))}
          label="Icon"
          initialIcon={formData.icon ?? "CircleHelp"}
        />

        <MyDropDown
          isModal={Platform.OS !== "web"}
          label="Color"
          options={[
            { id: "info-100", label: "Info", value: "info-100", textColorClass: "info-100" },
            { id: "success-100", label: "Success", value: "success-100", textColorClass: "success-100" },
            { id: "warning-100", label: "Warning", value: "warning-100", textColorClass: "warning-100" },
            { id: "error-100", label: "Error", value: "error-100", textColorClass: "error-100" },
          ]}
          selectedValue={formData.iconcolor}
          onSelect={value => {
            handleTextChange("iconcolor", value?.value);
          }}
        />

        <Button
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
            mutate(formData, {
              onSuccess: () => {
                addNotification({ message: "Category Created Successfully", type: "success" });
                router.replace("/Accounts");
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
