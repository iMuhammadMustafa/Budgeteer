import { useState } from "react";
import { Account, Category } from "../../lib/supabase";
import { Platform, Pressable, SafeAreaView, ScrollView, Text } from "react-native";
import TextInputField from "../TextInputField";
import MyDropDown, { MyTransactionTypesDropdown } from "../MyDropdown";
import { TransactionsSearchParams } from "@/src/types/transactions.types";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

const emptyCategories = [
  {
    id: "",
    label: "None",
    value: "",
    icon: "",
    iconColorClass: "",
  },
];

const emptyAccounts = [
  {
    id: "",
    label: "None",
    value: "",
  },
];

export default function TransactionSearchForm({
  filters,
  categories,
  accounts,
  onClear,
  onSubmit,
}: {
  filters?: TransactionsSearchParams | null;
  categories: Category[];
  accounts: Account[];
  onClear: () => void;
  onSubmit: (filters: TransactionsSearchParams | null) => void;
}) {
  const [searchParams, setSearchParams] = useState<TransactionsSearchParams | null>(filters ?? null);

  const handleTextChange = (name: keyof TransactionsSearchParams, text: string) => {
    setSearchParams(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  // const groups: SearchableDropdownItem[] = categoryGroups
  //                               ? categoryGroups.map(item => ({ id: item.group, label: item.group, item: item }))
  //                               : [];

  console.log(filters);
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
          value={searchParams?.description}
          onChange={text => handleTextChange("description", text)}
        />

        <MyDropDown
          label="Category"
          selectedValue={searchParams?.categoryid}
          options={emptyCategories.concat(
            categories.map(category => ({
              id: category.id,
              label: category.name,
              value: category.id,
              icon: category.icon,
              iconColorClass: category.iconColor,
            })),
          )}
          onSelect={value => handleTextChange("categoryid", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <MyDropDown
          label="Account"
          selectedValue={searchParams?.accountid}
          options={emptyAccounts.concat(
            accounts.map(account => ({
              id: account.id,
              label: account.name,
              value: account.id,
            })),
          )}
          onSelect={value => handleTextChange("accountid", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <MyTransactionTypesDropdown
          selectedValue={searchParams?.type}
          onSelect={value => handleTextChange("type", value?.value)}
          isModal={Platform.OS !== "web"}
        />

        <TextInputField
          label="Amount"
          value={searchParams?.amount}
          onChange={text => handleTextChange("amount", text)}
        />

        <View className="flex flex-row justify-center items-center gap-2">
          <Pressable
            className="bg-error-300 p-2 rounded-md w-1/4 justify-center items-center"
            onPress={() => {
              setSearchParams(null);
              onClear();
            }}
          >
            <Text className="text-foreground text-md">Clear</Text>
          </Pressable>
          <Pressable
            className="bg-primary p-2 rounded-md w-1/4 justify-center items-center"
            onPress={() => {
              onSubmit(searchParams);
            }}
          >
            <Text className="text-foreground text-md">Search</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
