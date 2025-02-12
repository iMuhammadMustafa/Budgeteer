import { useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionGroup, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertTransactionGroup } from "@/src/services/repositories/TransactionGroups.Repository";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";

export type TransactionGroupFormType = Inserts<TableNames.TransactionGroups> | Updates<TableNames.TransactionGroups>;

export const initialState: TransactionGroupFormType = {
  name: "",
  type: "Expense",
  description: "",
  budgetamount: 0,
  budgetfrequency: "",
  icon: "",
  color: "",
  displayorder: 0,
};

export default function TransactionGroupForm({ group }: { group: TransactionGroupFormType }) {
  const [formData, setFormData] = useState<TransactionGroupFormType>(group);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(group);
  }, [group]);

  const { mutate } = useUpsertTransactionGroup();

  const handleTextChange = (name: keyof TransactionGroupFormType, text: string) => {
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

        <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between`}>
          <View className="flex-1">
            <IconPicker
              onSelect={(icon: any) => handleTextChange("icon", icon)}
              label="Icon"
              initialIcon={formData.icon ?? "CircleHelp"}
            />
          </View>
          <ColorsPickerDropdown
            selectedValue={formData.color}
            handleSelect={value => handleTextChange("color", value?.value)}
          />
        </View>

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
                originalData: group as TransactionGroup,
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
