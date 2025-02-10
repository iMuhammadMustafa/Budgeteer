import { useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionGroup, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertTransactionGroup } from "@/src/services/repositories/TransactionGroups.Repository";
import DropdownField from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";

export type CategoryGroupFormType = Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;

export default function CategoryGroupForm({ category }: { category: CategoryGroupFormType }) {
  const [formData, setFormData] = useState<CategoryGroupFormType>(category);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertTransactionGroup();

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

        <DropdownField
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

        <DropdownField
          isModal={Platform.OS !== "web"}
          label="Color"
          options={[
            { id: "info-100", label: "Info", value: "info-100", textColorClass: "info-100" },
            { id: "success-100", label: "Success", value: "success-100", textColorClass: "success-100" },
            { id: "warning-100", label: "Warning", value: "warning-100", textColorClass: "warning-100" },
            { id: "error-100", label: "Error", value: "error-100", textColorClass: "error-100" },
          ]}
          selectedValue={formData.color}
          onSelect={value => {
            handleTextChange("color", value?.value);
          }}
        />

        <Pressable
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
            mutate(
              {
                formData,
                originalData: category as TransactionGroup,
              },
              {
                onSuccess: () => {
                  console.log({ message: "Category Created Successfully", type: "success" });
                  router.replace("/Accounts");
                },
              },
            );
          }}
        >
          <Text className={`font-medium text-sm ml-2 ${isLoading ? "text-muted" : ""}`} selectable={false}>
            Save
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
