import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionCategory, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertTransactionCategory } from "@/src/services/repositories/TransactionCategories.Service";
import { useGetTransactionGroups } from "@/src/services/repositories/TransactionGroups.Service";
import DropdownField, { ColorsPickerDropdown, MyTransactionTypesDropdown } from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";
import Button from "../Button";

export type TransactionCategoryFormType =
  | Inserts<TableNames.TransactionCategories>
  | Updates<TableNames.TransactionCategories>;

export const initialState: TransactionCategoryFormType = {
  name: "",
  description: "",

  budgetamount: 0,
  budgetfrequency: "",

  icon: "",
  color: "",
  displayorder: 0,
  groupid: "",
};

export default function CategoryForm({ category }: { category: TransactionCategoryFormType }) {
  const [formData, setFormData] = useState<TransactionCategoryFormType>(category);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertTransactionCategory();

  const { data: categoryGroups, isLoading: iscategoryGroupLoading } = useGetTransactionGroups();

  const isValid =
    !isLoading && !!formData.name && formData.name.length > 0 && !!formData.groupid && formData.groupid.length > 0;

  const handleIconSelect = useCallback((icon: string) => {
    setFormData(prevFormData => ({ ...prevFormData, icon }));
  }, []);

  const handleTextChange = (name: keyof TransactionCategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  const handleSubmit = () => {
    mutate(
      {
        formData,
        originalData: category as TransactionCategory,
      },
      {
        onSuccess: () => {
          console.log({ message: "Category Created Successfully", type: "success" });
          router.replace("/Categories");
        },
      },
    );
  };

  if (iscategoryGroupLoading) return <Text>Loading...</Text>;

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="p-5 flex-1 px-6" nestedScrollEnabled={true}>
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />
        <DropdownField
          isModal={Platform.OS !== "web"}
          label="Group"
          options={
            categoryGroups?.map(item => ({
              id: item.id,
              label: item.name,
              group: item.type,
              value: item.id,
              icon: item.icon,
            })) ?? []
          }
          selectedValue={formData.groupid}
          groupBy="type"
          onSelect={value => {
            handleTextChange("groupid", value?.value);
          }}
        />
        <View
          className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between relative z-9`}
          removeClippedSubviews={false}
        >
          <View className="flex-1">
            <IconPicker
              onSelect={(icon: any) => handleIconSelect(icon)}
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
          className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between relative z-[-9]`}
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

        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />
        <Button isValid={isValid} label="Save" onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
