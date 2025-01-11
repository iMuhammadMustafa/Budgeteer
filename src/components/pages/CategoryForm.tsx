import { useCallback, useEffect, useState } from "react";
import { Inserts, Updates } from "../../lib/supabase";
import { useGetCategoryGroups, useUpsertCategory } from "../../repositories/categories.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import { Platform, SafeAreaView, ScrollView, Text } from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import IconPicker from "../IconPicker";
import { TableNames } from "../../consts/TableNames";
import MyDropDown, { MyTransactionTypesDropdown } from "../MyDropdown";
import SearchableDropdown, { SearchableDropdownItem } from "../SearchableDropdown";

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

  const { data: categoryGroups, isLoading: iscategoryGroupLoading } = useGetCategoryGroups();

  const handleIconSelect = useCallback((icon: string) => {
    setFormData(prevFormData => ({ ...prevFormData, icon }));
  }, []);
  const handleGroupIconSelect = useCallback((icon: string) => {
    setFormData(prevFormData => ({ ...prevFormData, groupicon: icon }));
  }, []);

  const handleTextChange = (name: keyof CategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  if(iscategoryGroupLoading) return <Text>Loading...</Text>

  const groups: SearchableDropdownItem[] = categoryGroups 
                                ? categoryGroups.map(item => ({ id: item.group, label: item.group, item: item }))
                                : [];

  const filterGroups = (val: string)=>{
    const res =  groups.filter(i => i.label.toLowerCase().includes(val.toLowerCase()))
    return res;
  }

  return (
    <SafeAreaView className="p-5 flex-1">
      <ScrollView className="p-5 px-6" nestedScrollEnabled={true}>
        <SearchableDropdown
          label="Group"
          searchAction={val => filterGroups(val)}
          initalValue={category.group}
          onSelectItem={val => {
            handleTextChange("group", val.id)
            handleTextChange("groupicon", val.item.groupicon)
          }}
          onChange={val => {
            handleTextChange("group", val)
          }}
          onPress={() => groups}
        />
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />

        <MyTransactionTypesDropdown 
        selectedValue={formData.type}
        onSelect={value => handleTextChange("type", value?.value)} 
        isModal={Platform.OS !== "web" }/>


        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />
        <IconPicker onSelect={handleIconSelect} label="Icon" initialIcon={formData.icon} />
        <IconPicker onSelect={handleGroupIconSelect} label="Group Icon" initialIcon={formData.icon} />

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
