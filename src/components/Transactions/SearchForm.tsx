import {
  AccountSelecterDropdown,
  MyCategoriesDropdown,
  MyTransactionTypesDropdown,
} from "@/src/components/elements/dropdown/DropdownField";
import MyModal from "@/src/components/elements/MyModal";
import TextInputField from "@/src/components/elements/TextInputField";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Account, TransactionCategory } from "@/src/types/database/Tables.Types";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function TransactionSearchForm({
  filters,
  categories,
  accounts,
  onClear,
  onSubmit,
  isOpen,
  setIsOpen,
}: {
  filters?: TransactionFilters | null;
  categories: TransactionCategory[];
  accounts: Account[];
  onClear: () => void;
  onSubmit: (filters: TransactionFilters | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [searchParams, setSearchParams] = useState<TransactionFilters | null>(filters ?? null);

  const handleTextChange = (name: keyof TransactionFilters, text: string) => {
    setSearchParams(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  if (!isOpen) return null;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={() => setIsOpen(false)}>
      <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
        <TextInputField label="Name" value={searchParams?.name} onChange={text => handleTextChange("name", text)} />
        <TextInputField
          label="Amount"
          value={searchParams?.amount?.toString()}
          onChange={text => handleTextChange("amount", text)}
        />
        <MyCategoriesDropdown
          selectedValue={searchParams?.categoryid}
          categories={categories}
          onSelect={value => handleTextChange("categoryid", value!.id)}
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

        <View className="flex flex-row justify-center items-center gap-4 mt-4">
          <Pressable
            className="bg-danger-300 p-3 rounded-md flex-1 justify-center items-center"
            onPress={() => {
              setSearchParams(null);
              onClear();
            }}
          >
            <Text selectable={false} className="text-foreground font-semibold text-md">
              Clear
            </Text>
          </Pressable>
          <Pressable
            className="bg-primary p-3 rounded-md flex-1 justify-center items-center"
            onPress={() => {
              onSubmit(searchParams);
            }}
          >
            <Text selectable={false} className="text-foreground font-semibold text-md">
              Search
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </MyModal>
  );
}
