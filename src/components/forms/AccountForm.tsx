import { useEffect, useState } from "react";
import { Platform, SafeAreaView, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { useGetAccountCategories } from "@/src/services/repositories/AccountCategories.Repository";
import {
  useGetAccountOpenedTransaction,
  useUpdateAccountOpenedTransaction,
  useUpsertAccount,
} from "@/src/services/repositories/Accounts.Repository";
import TextInputField from "../TextInputField";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import { queryClient } from "@/src/providers/QueryProvider";
import Button from "../Button";

export default function AccountForm({ account }: { account: AccountFormType }) {
  const [formData, setFormData] = useState<AccountFormType>(account);
  const [isLoading, setIsLoading] = useState(false);
  const { data: accountCategories } = useGetAccountCategories();
  // const [isOpen, setIsOpen] = useState(false);
  const { data: openTransaction } = useGetAccountOpenedTransaction(account.id);
  const [openBalance, setOpenBalance] = useState<number | null>(null);

  const isValid: boolean =
    !isLoading &&
    !!formData.name &&
    formData.name.length > 0 &&
    !!formData.categoryid &&
    formData.categoryid.length > 0;

  useEffect(() => {
    setFormData(account);
  }, [account]);

  useEffect(() => {
    if (openTransaction) {
      setOpenBalance(openTransaction.amount);
    }
  }, [openTransaction]);

  // Add effect to update account balance when open balance changes
  useEffect(() => {
    if (openTransaction && openBalance !== null && openTransaction.amount !== openBalance) {
      const difference = openBalance - openTransaction.amount;
      setFormData(prevData => ({
        ...prevData,
        balance: Number(prevData.balance || 0) + difference
      }));
    }
  }, [openBalance, openTransaction]);

  const { mutate } = useUpsertAccount();
  const { mutate: updateOpenBalance } = useUpdateAccountOpenedTransaction();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = () => {
    setIsLoading(true);
    console.log(formData);

    if (openTransaction && openBalance !== null) {
      updateOpenBalance({
        id: openTransaction.id,
        amount: openBalance,
      });
    }

    mutate(
      { formAccount: { ...formData }, originalData: account as Account },
      {
        onSuccess: () => {
          setIsLoading(false);
          console.log({ message: "Account Created Successfully", type: "success" });
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
          router.navigate("/Accounts");
        },
      },
    );
  };

  return (
    <SafeAreaView className="p-5">
      <ScrollView className="px-5">
        <TextInputField label="Name" value={formData.name} onChange={name => handleFieldChange("name", name)} />
        <TextInputField label="Owner" value={formData.owner} onChange={owner => handleFieldChange("owner", owner)} />

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
        <View className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""} items-center justify-between`}>
          <View className="flex-1">
            <IconPicker
              onSelect={(icon: any) => handleFieldChange("icon", icon)}
              label="Icon"
              initialIcon={formData.icon ?? "CircleHelp"}
            />
          </View>
          <ColorsPickerDropdown
            selectedValue={formData.color}
            handleSelect={value => handleFieldChange("color", value?.value)}
          />
        </View>

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
        {openTransaction && (
          <TextInputField
            label="Open Balance"
            value={openBalance?.toString() ?? "0"}
            onChange={balance => setOpenBalance(balance)}
            keyboardType="numeric"
          />
        )}

        <TextInputField label="Notes" value={formData.notes} onChange={notes => handleFieldChange("notes", notes)} />

        <Button isValid={isValid} label="Save" onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

export type AccountFormType = Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;
export const initialState: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts> = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
};
