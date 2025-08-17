import { useEffect, useState } from "react";
import { Platform, SafeAreaView, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import TextInputField from "../TextInputField";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import Button from "../Button";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export type AccountCategoryFormType = Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;
export const initialState: Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories> = {
  name: "",
  icon: "CircleHelp",
  color: "",
  displayorder: 0,
  type: "Asset",
};

export default function AccountCategoryForm({ category }: { category: AccountCategoryFormType }) {
  const [formData, setFormData] = useState<AccountCategoryFormType>(category);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);
  const accountCategoryService = useAccountCategoryService();

  const { mutate } = accountCategoryService.upsert();

  const handleTextChange = (name: keyof AccountCategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  const isValid = !isLoading && !!formData.name && formData.name.length > 0;
  const handleSubmit = () => {
    mutate(
      {
        form: formData,
        original: category as AccountCategory,
      },
      {
        onSuccess: () => {
          console.log({ message: "Category Created Successfully", type: "success" });
          router.replace("/Accounts");
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="p-5 flex-1" nestedScrollEnabled={true}>
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />

        <DropdownField
          isModal={Platform.OS !== "web"}
          label="Type"
          options={[
            { id: "Asset", label: "Asset", value: "Asset" },
            { id: "Liability", label: "Liability", value: "Liability" },
          ]}
          selectedValue={formData.type}
          onSelect={value => handleTextChange("type", value?.value)}
        />

        <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between z-10`}>
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

        <Button label="Save" onPress={handleSubmit} isValid={isValid} />
      </ScrollView>
    </SafeAreaView>
  );
}
