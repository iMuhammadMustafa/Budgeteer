import { useEffect, useState } from "react";
import { Account, Category } from "../../lib/supabase";
import { Platform, SafeAreaView, ScrollView } from "react-native";
import TextInputField from "../TextInputField";
import { Button, ButtonText } from "@/components/ui/button";
import MyDropDown, { MyTransactionTypesDropdown } from "../MyDropdown";
import { initalTransactionSearchParams, TransactionsSearchParams } from "@/src/types/transactions.types";

export default function TransactionSearchForm({
  searchParams,
  setSearchParams,
  categories,
  accounts,
  onSubmit,
}: {
  searchParams: TransactionsSearchParams;
  setSearchParams: (params: TransactionsSearchParams) => void;
  categories: Category[];
  accounts: Account[];
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState<TransactionsSearchParams>(initalTransactionSearchParams);

  useEffect(() => {
    setFormData(searchParams);
  }, [searchParams]);

  const handleTextChange = (name: keyof TransactionsSearchParams, text: string) => {
    setFormData(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  // const groups: SearchableDropdownItem[] = categoryGroups
  //                               ? categoryGroups.map(item => ({ id: item.group, label: item.group, item: item }))
  //                               : [];

  return (
    <SafeAreaView className="p-5 flex-1">
      <ScrollView className="p-5 px-6" nestedScrollEnabled={true}>
        {/* <SearchableDropdown
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
        /> */}

        <TextInputField
          label="Description"
          value={formData.description}
          onChange={text => handleTextChange("description", text)}
        />

        <MyDropDown
          label="Category"
          selectedValue={formData.categoryid}
          options={categories.map(category => ({
            id: category.id,
            label: category.name,
            value: category.id,
            icon: category.icon,
            iconColorClass: category.type === "Income" ? "green-500" : "red-500",
          }))}
          onSelect={value => handleTextChange("categoryid", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <MyDropDown
          label="Account"
          selectedValue={formData.accountid}
          options={accounts.map(account => ({
            id: account.id,
            label: account.name,
            value: account.id,
          }))}
          onSelect={value => handleTextChange("accountid", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <MyTransactionTypesDropdown
          selectedValue={formData.type}
          onSelect={value => handleTextChange("type", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <TextInputField label="Amount" value={formData.amount} onChange={text => handleTextChange("amount", text)} />

        <Button
          className="p-3 flex justify-center items-center"
          onPress={() => {
            setSearchParams(formData);
          }}
        >
          <ButtonText className="font-medium text-sm ml-2" onPress={onSubmit}>
            Search
          </ButtonText>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
