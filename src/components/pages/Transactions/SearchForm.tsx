import { useState } from "react";
import { Account, TransactionCategory } from "@/src/types/db/Tables.Types";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import TextInputField from "../../TextInputField";
import DropdownField, {
  AccountSelecterDropdown,
  MyCategoriesDropdown,
  MyTransactionTypesDropdown,
} from "../../DropDownField";

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
  filters?: TransactionFilters | null;
  categories: TransactionCategory[];
  accounts: Account[];
  onClear: () => void;
  onSubmit: (filters: TransactionFilters | null) => void;
}) {
  const [searchParams, setSearchParams] = useState<TransactionFilters | null>(filters ?? null);

  const handleTextChange = (name: keyof TransactionFilters, text: string) => {
    setSearchParams(prevFormData => ({ ...prevFormData, [name]: text }));
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
        <TextInputField label="Name" value={searchParams?.name} onChange={text => handleTextChange("name", text)} />
        <TextInputField
          label="Description"
          value={searchParams?.description}
          onChange={text => handleTextChange("description", text)}
        />

        <MyCategoriesDropdown
          selectedValue={searchParams?.categoryid}
          categories={categories}
          onSelect={value => handleTextChange("categoryid", value.id)}
          isModal
        />
        <AccountSelecterDropdown
          label="Account"
          selectedValue={searchParams?.accountid}
          onSelect={(value: any) => {
            handleTextChange("accountid", value.id);
          }}
          isModal
          accounts={accounts}
          groupBy="group"
        />
        <MyTransactionTypesDropdown
          selectedValue={searchParams?.type}
          onSelect={value => {
            handleTextChange("type", value.value);
          }}
          isModal
          isEdit={false}
        />

        <TextInputField
          label="Amount"
          value={searchParams?.amount?.toString()}
          onChange={text => handleTextChange("amount", text)}
        />

        <View className="flex flex-row justify-center items-center gap-4 mt-4">
          <Pressable
            className="bg-danger-300 p-3 rounded-md flex-1 justify-center items-center"
            onPress={() => {
              setSearchParams(null);
              onClear();
            }}
          >
            <Text className="text-foreground font-semibold text-md">Clear</Text>
          </Pressable>
          <Pressable
            className="bg-primary p-3 rounded-md flex-1 justify-center items-center"
            onPress={() => {
              onSubmit(searchParams);
            }}
          >
            <Text className="text-foreground font-semibold text-md">Search</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
