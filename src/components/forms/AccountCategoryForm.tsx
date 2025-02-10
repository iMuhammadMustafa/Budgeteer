import { useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text } from "react-native";
import { router } from "expo-router";

import { AccountCategory, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertAccountCategory } from "@/src/services/repositories/AccountCategories.Repository";
import TextInputField from "../TextInputField";
import DropdownField from "../DropDownField";
import IconPicker from "../IconPicker";

export type AccountCategoryFormType = Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;

export default function AccountCategoryForm({ category }: { category: AccountCategoryFormType }) {
  const [formData, setFormData] = useState<AccountCategoryFormType>(category);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertAccountCategory();

  const handleTextChange = (name: keyof AccountCategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
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

        <IconPicker
          onSelect={(icon: any) => setFormData(prevFormData => ({ ...prevFormData, icon }))}
          label="Icon"
          initialIcon={formData.icon ?? "CircleHelp"}
        />

        <Pressable
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
            mutate(
              {
                formData,
                originalData: category as AccountCategory,
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
