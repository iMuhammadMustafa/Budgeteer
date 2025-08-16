import { useEffect, useState } from "react";
import { Platform, SafeAreaView, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionGroup, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertTransactionGroup } from "@/src/services//TransactionGroups.Service";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";
import Button from "../Button";

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

  const handleSubmit = () => {
    mutate(
      {
        formData,
        originalData: group as TransactionGroup,
      },
      {
        onSuccess: () => {
          console.log({ message: "Category Created Successfully", type: "success" });
          router.replace("/Categories");
        },
      },
    );
  };

  const isValid = !isLoading && !!formData.name && formData.name.length > 0;

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="p-5 flex-1">
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

        <View
          className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between relative z-[9]`}
        >
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

        <View
          className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between  relative z-[8]`}
        >
          <TextInputField
            label="Budget Amount"
            value={formData.budgetamount?.toString()}
            onChange={text => {
              const numberRegex = /^[0-9]*$/;
              numberRegex.test(text) && handleTextChange("budgetamount", text);
            }}
          />
          <DropdownField
            isModal={Platform.OS !== "web"}
            label="Budget Frequency"
            options={[
              { id: "Daily", label: "Daily", value: "Daily" },
              { id: "Weekly", label: "Weekly", value: "Weekly" },
              { id: "Monthly", label: "Monthly", value: "Monthly" },
              { id: "Yearly", label: "Yearly", value: "Yearly" },
            ]}
            selectedValue={formData.budgetfrequency}
            onSelect={value => handleTextChange("budgetfrequency", value?.value)}
          />
        </View>
        <Button isValid={isValid} label="Save" onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
