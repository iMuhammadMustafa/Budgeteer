import Button from "@/src/components/elements/Button";
import {
  AccountSelecterDropdown,
  MyCategoriesDropdown,
  MyTransactionTypesDropdown,
} from "@/src/components/elements/dropdown/DropdownField";
import MyModal from "@/src/components/elements/MyModal";
import TextInputField from "@/src/components/elements/TextInputField";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TransactionSearchFormProps } from "@/src/types/components/Transactions.types";
import { useState } from "react";
import { Platform, ScrollView, View } from "react-native";

export default function TransactionSearchForm({
  filters,
  categories,
  accounts,
  onClear,
  onSubmit,
  isOpen,
  setIsOpen,
}: TransactionSearchFormProps) {
  const [searchParams, setSearchParams] = useState<TransactionFilters | null>(filters ?? null);

  const handleTextChange = (name: keyof TransactionFilters, text: string) => {
    setSearchParams(prevFormData => ({ ...prevFormData, [name]: text }));
  };

  if (!isOpen) return null;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={() => setIsOpen(false)}>
      <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
        <TextInputField
          placeholder="Name"
          value={searchParams?.name}
          onChange={text => handleTextChange("name", text)}
        />
        <TextInputField
          placeholder="Amount"
          value={searchParams?.amount?.toString()}
          onChange={text => handleTextChange("amount", text)}
        />
        <View>
          <MyCategoriesDropdown
            selectedValue={searchParams?.categoryid}
            categories={categories}
            onSelect={value => handleTextChange("categoryid", value!.id)}
            isModal={Platform.OS !== "web"}
          />
        </View>
        <AccountSelecterDropdown
          label="Account"
          selectedValue={searchParams?.accountid}
          onSelect={(value: any) => {
            handleTextChange("accountid", value.id);
          }}
          isModal={Platform.OS !== "web"}
          accounts={accounts}
          groupBy="group"
        />

        <MyTransactionTypesDropdown
          selectedValue={searchParams?.type}
          onSelect={value => {
            handleTextChange("type", value.value);
          }}
          isModal={Platform.OS !== "web"}
          isEdit={false}
        />

        <View className="flex flex-row justify-center items-center gap-4 mt-4">
          <Button
            variant="destructive"
            size="md"
            hapticFeedback="medium"
            className="flex-1"
            onPress={() => {
              setSearchParams(null);
              onClear();
            }}
            label="Clear"
            testID="btn-search-clear"
          />
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onPress={() => {
              onSubmit(searchParams);
            }}
            label="Search"
            testID="btn-search-submit"
          />
        </View>
      </ScrollView>
    </MyModal>
  );
}
