import { useEffect, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Modal from "react-native-modal";

import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useGetAccountCategories } from "@/src/services/repositories/AccountCategories.Repository";
import { useUpsertAccount } from "@/src/services/repositories/Accounts.Repository";
import TextInputField from "../TextInputField";
import DropdownField from "../DropDownField";
import IconPicker from "../IconPicker";
import { queryClient } from "@/src/providers/QueryProvider";

export default function AccountForm({ account }: { account: AccountFormType }) {
  const [formData, setFormData] = useState<AccountFormType>(account);
  const [isLoading, setIsLoading] = useState(false);
  const { data: accountCategories } = useGetAccountCategories();
  // const [isOpen, setIsOpen] = useState(false);
  // const { data: openBalance} = useGetAccountOpenBalance(account.id);

  console.log(accountCategories);

  useEffect(() => {
    setFormData(account);
  }, [account]);

  const { mutate } = useUpsertAccount();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = () => {
    setIsLoading(true);
    mutate(
      { formAccount: { ...formData, balance: formData.balance }, originalData: account as Account },
      {
        onSuccess: () => {
          setIsLoading(false);
          console.log({ message: "Account Created Successfully", type: "success" });
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
          router.back();
        },
      },
    );
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView className="px-5">
        <TextInputField label="Name" value={formData.name} onChange={name => handleFieldChange("name", name)} />
        <TextInputField label="Owner" value={formData.owner} onChange={owner => handleFieldChange("owner", owner)} />

        <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
          <DropdownField
            isModal={Platform.OS !== "web"}
            label="Category"
            options={
              accountCategories?.map(item => ({
                id: item.id,
                label: item.name,
                group: item.type,
                value: item.id,
                icon: item.icon,
              })) ?? []
            }
            selectedValue={formData.categoryid}
            groupBy="type"
            onSelect={value => {
              handleFieldChange("categoryid", value?.value);
            }}
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
              handleFieldChange("color", value?.value);
            }}
          />
        </View>
        <IconPicker
          onSelect={(icon: any) => setFormData(prevFormData => ({ ...prevFormData, icon }))}
          label="Icon"
          initialIcon={formData.icon ?? "CircleHelp"}
        />

        <TextInputField
          label="Currency"
          value={formData.currency}
          onChange={currency => handleFieldChange("currency", currency)}
        />
        <TextInputField
          label="Balance"
          value={formData.balance?.toString()}
          onChange={balance => handleFieldChange("balance", balance)}
          keyboardType="numeric"
        />
        {/* <TextInputField
          label="Open Balance"
          value={openBalance.amount?.toString()}
          onChange={balance => handleFieldChange("openBalance", balance)}
          keyboardType="numeric"
        /> */}

        <TextInputField label="Notes" value={formData.notes} onChange={notes => handleFieldChange("notes", notes)} />

        <Pressable className="p-3 flex justify-center items-center" disabled={isLoading} onPress={handleSubmit}>
          <Text className={`font-medium text-sm ml-2 ${isLoading ? "text-muted" : ""}`} selectable={false}>
            Save
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export type AccountFormType = Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
export const initialAccountState: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts> = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
};
