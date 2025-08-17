import { useEffect, useState } from "react";
import { Platform, SafeAreaView, ScrollView, View, Switch, Text } from "react-native";
import { router } from "expo-router";

import { Account, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import TextInputField from "../TextInputField";
import DropdownField, { ColorsPickerDropdown } from "../DropDownField";
import IconPicker from "../IconPicker";
import { queryClient } from "@/src/providers/QueryProvider";
import Button from "../Button";
import { useAccountService } from "@/src/services/Accounts.Service";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function AccountForm({ account }: { account: AccountFormType }) {
  const accountService = useAccountService();
  const accountCategoryService = useAccountCategoryService();
  const [formData, setFormData] = useState<AccountFormType>(account);
  const [isLoading, setIsLoading] = useState(false);
  const { data: accountCategories } = accountCategoryService.findAll();
  // const [isOpen, setIsOpen] = useState(false);
  const { data: openTransaction } = accountService.getAccountOpenedTransaction(account.id);
  const [openBalance, setOpenBalance] = useState<number | null>(null);
  const [addAdjustmentTransaction, setAddAdjustmentTransaction] = useState(true);

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
        balance: Number(prevData.balance || 0) + difference,
      }));
    }
  }, [openBalance, openTransaction]);

  const { mutate: updateAccount } = accountService.upsert();
  const { mutate: updateOpenBalance } = accountService.updateAccountOpenedTransaction();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = () => {
    setIsLoading(true);

    if (openTransaction && openBalance !== null) {
      updateOpenBalance({
        id: openTransaction.id,
        amount: openBalance,
      });
    }

    updateAccount(
      { form: { ...formData }, original: account as Account, props: { addAdjustmentTransaction } },
      {
        onSuccess: () => {
          setIsLoading(false);
          queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
          queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
          router.navigate("/Accounts");
        },
        onError: error => {
          setIsLoading(false);
          console.error("Error updating account:", error);
        },
      },
    );
  };

  const handleSyncRunningBalance = () => {
    if (account.running_balance !== null && account.running_balance !== undefined && account.id) {
      const updatedAccount: Updates<TableNames.Accounts> = {
        id: account.id,
        balance: account.running_balance,
      };
      updateAccount({ form: updatedAccount, original: account as Account, props: { addAdjustmentTransaction: false } });
    }
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
        <View className="flex flex-row items-center justify-between -z-20">
          <View style={{ flex: 1 }}>
            <TextInputField
              label="Balance"
              value={formData.balance?.toString()}
              onChange={balance => handleFieldChange("balance", balance)}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
            <Switch value={addAdjustmentTransaction} onValueChange={setAddAdjustmentTransaction} />
            <Text style={{ marginLeft: 5 }}>Add Adjustment Transaction</Text>
          </View>
        </View>

        {account.id && formData.running_balance !== undefined && account.running_balance !== account.balance && (
          <View className="flex flex-row items-center justify-center gap-2 -z-20">
            <View style={{ flex: 1 }}>
              <TextInputField
                label="Running Balance"
                isReadOnly={true}
                value={formData.running_balance?.toString()}
                keyboardType="numeric"
                onChange={() => {}}
              />
            </View>
            <Button label="Sync" onPress={handleSyncRunningBalance} />
          </View>
        )}

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

export type AccountFormType = (Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>) & {
  running_balance?: number | null;
};
export const initialState: AccountFormType = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
  running_balance: null,
};
