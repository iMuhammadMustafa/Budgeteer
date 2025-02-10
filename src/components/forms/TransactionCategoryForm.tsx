import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Inserts, TransactionCategory, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useUpsertTransactionCategory } from "@/src/services/repositories/TransactionCategories.Repository";
import { useGetTransactionGroups } from "@/src/services/repositories/TransactionGroups.Repository";
import DropdownField, { MyTransactionTypesDropdown } from "../DropDownField";
import TextInputField from "../TextInputField";
import IconPicker from "../IconPicker";

export type TransactionCategoryForm =
  | Inserts<TableNames.TransactionCategories>
  | Updates<TableNames.TransactionCategories>;

export default function CategoryForm({ category }: { category: TransactionCategoryForm }) {
  const [formData, setFormData] = useState<TransactionCategoryForm>(category);
  const [isLoading] = useState(false);

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertTransactionCategory();

  const { data: categoryGroups, isLoading: iscategoryGroupLoading } = useGetTransactionGroups();

  const handleIconSelect = useCallback((icon: string) => {
    setFormData(prevFormData => ({ ...prevFormData, icon }));
  }, []);

  const handleTextChange = (name: keyof TransactionCategoryForm, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  if (iscategoryGroupLoading) return <Text>Loading...</Text>;

  return (
    <SafeAreaView className="p-5 flex-1">
      <ScrollView className="p-5 px-6" nestedScrollEnabled={true}>
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

        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />

        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />
        <IconPicker onSelect={handleIconSelect} label="Icon" initialIcon={formData.icon} />

        <Pressable
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
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
