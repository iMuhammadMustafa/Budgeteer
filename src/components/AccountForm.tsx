import { SafeAreaView, ScrollView } from "react-native";
import { Account, Inserts, TableNames, Updates } from "../lib/supabase";
import TextInputField from "./TextInputField";
import { useEffect, useState } from "react";
import { useUpsertAccount } from "../repositories/account.service";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetAccountCategories } from "../repositories/accountcategories.service";
import DropdownField from "./DropdownField";
import { useRouter } from "expo-router";
import { useNotifications } from "../providers/NotificationsProvider";

export type AccountFormType = Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;

export default function AccountForm({ account }: { account: AccountFormType }) {
  const [formData, setFormData] = useState<AccountFormType>(account);
  const [isLoading] = useState(false);
  const { data: accountCategories } = useGetAccountCategories();
  const router = useRouter();

  useEffect(() => {
    setFormData(account);
  }, [account]);

  const { mutate } = useUpsertAccount();
  const { addNotification } = useNotifications();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField label="Name" value={formData.name} onChange={name => handleFieldChange("name", name)} />

        <DropdownField
          label="Category"
          initalValue={formData.categoryid}
          list={accountCategories?.map(item => ({ name: item.name + "-" + item.type, id: item.id }))}
          onSelect={(category: any) => setFormData({ ...formData, categoryid: category.id })}
        />

        <TextInputField
          label="Currency"
          value={formData.currency}
          onChange={currency => handleFieldChange("currency", currency)}
        />
        <TextInputField
          label="Balance"
          value={formData.balance?.toString()}
          onChange={balance => handleFieldChange("balance", parseFloat(balance))}
          keyboardType="numeric"
        />

        <TextInputField label="Notes" value={formData.notes} onChange={notes => handleFieldChange("notes", notes)} />
        <Button
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() =>
            mutate(
              { formAccount: formData, originalData: account as Account },
              {
                onSuccess: () => {
                  addNotification({ message: "Account Created Successfully", type: "success" });
                  router.back();
                },
              },
            )
          }
        >
          {isLoading ? <ButtonSpinner /> : <ButtonText className="font-medium text-sm ml-2">Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
