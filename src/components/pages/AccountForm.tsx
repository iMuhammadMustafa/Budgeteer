import { Platform, SafeAreaView, ScrollView } from "react-native";
import { Account, Inserts, Updates } from "../../lib/supabase";
import TextInputField from "../TextInputField";
import { useEffect, useState } from "react";
import { useGetAccountOpenBalance, useUpsertAccount } from "../../repositories/account.service";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useGetAccountCategories } from "../../repositories/accountcategories.service";
import { useRouter } from "expo-router";
import { useNotifications } from "../../providers/NotificationsProvider";
import { TableNames } from "../../consts/TableNames";
import MyDropDown from "../MyDropdown";
import IconPicker from "../IconPicker";
import { Box } from "@/components/ui/box";

export type AccountFormType = Inserts<TableNames.Accounts> | Updates<TableNames.Accounts>;

export default function AccountForm({ account }: { account: AccountFormType }) {
  const [formData, setFormData] = useState<AccountFormType>(account);
  const [isLoading, setIsLoading] = useState(false);
  const { data: accountCategories } = useGetAccountCategories();
  // const { data: openBalance} = useGetAccountOpenBalance(account.id);
  const router = useRouter();

  useEffect(() => {
    setFormData(account);
  }, [account]);

  const { mutate } = useUpsertAccount();
  const { addNotification } = useNotifications();

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  const handleSubmit = () => {
    setIsLoading(true);
    mutate(
      { formAccount: { ...formData, balance: parseFloat(formData.balance) }, originalData: account as Account },
      {
        onSuccess: () => {
          addNotification({ message: "Account Created Successfully", type: "success" });
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

        <Box className={`${Platform.OS === "web" ? "flex flex-row gap-5" : ""}`}>
          <MyDropDown
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
          <MyDropDown
            isModal={Platform.OS !== "web"}
            label="Color"
            options={[
              { id: "info-100", label: "Info", value: "info-100", textColorClass: "info-100" },
              { id: "success-100", label: "Success", value: "success-100", textColorClass: "success-100" },
              { id: "warning-100", label: "Warning", value: "warning-100", textColorClass: "warning-100" },
              { id: "error-100", label: "Error", value: "error-100", textColorClass: "error-100" },
            ]}
            selectedValue={formData.iconColor}
            onSelect={value => {
              handleFieldChange("iconColor", value?.value);
            }}
          />
        </Box>
        <IconPicker
          onSelect={icon => setFormData(prevFormData => ({ ...prevFormData, icon }))}
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

        <Button className="p-3 flex justify-center items-center" disabled={isLoading} onPress={handleSubmit}>
          {isLoading ? <ButtonSpinner /> : <ButtonText className="font-medium text-sm ml-2">Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
