import { useEffect, useState } from "react";
import { AccountCategoryTypes, Inserts, Updates } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useNotifications } from "../providers/NotificationsProvider";
import { SafeAreaView, ScrollView } from "react-native";
import TextInputField from "./TextInputField";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { TableNames } from "../consts/TableNames";
import DropdownField from "./DropdownField";
import { useUpsertAccountCategory } from "../repositories/accountcategories.service";

export type AccountCategoryFormType = Inserts<TableNames.AccountCategories> | Updates<TableNames.AccountCategories>;

export default function AccountCategoryForm({ category }: { category: AccountCategoryFormType }) {
  const [formData, setFormData] = useState<AccountCategoryFormType>(category);
  const [isLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setFormData(category);
  }, [category]);

  const { mutate } = useUpsertAccountCategory();
  const { addNotification } = useNotifications();

  const handleTextChange = (name: keyof AccountCategoryFormType, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField label="Name" value={formData.name} onChange={text => handleTextChange("name", text)} />

        <DropdownField
          label="Type"
          initalValue={category.type}
          onSelect={({ name }: { name: AccountCategoryTypes }) => handleTextChange("type", name)}
          list={[
            { id: "Asset", name: "Asset" },
            { id: "Liability", name: "Liability" },
          ]}
        />

        <Button
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => {
            mutate(formData, {
              onSuccess: () => {
                addNotification({ message: "Category Created Successfully", type: "success" });
                router.replace("/Accounts/Categories");
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
