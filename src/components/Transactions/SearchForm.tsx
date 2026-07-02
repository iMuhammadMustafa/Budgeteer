import {
  AccountSelecterDropdown,
  Button,
  Input,
  MyCategoriesDropdown,
  MyTransactionTypesDropdown,
  ResponsiveModal,
} from "@/src/components/ui";
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

  const clearField = (name: keyof TransactionFilters) => {
    setSearchParams(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleClose = () => setIsOpen(false);

  if (!isOpen) return null;

  const content = (
    <ScrollView className="p-5 px-6 flex-1" nestedScrollEnabled={true}>
      <Input
        placeholder="Amount"
        value={searchParams?.amount?.toString() ?? ""}
        onChangeText={text => handleTextChange("amount", text)}
      />
      <View>
        <MyCategoriesDropdown
          selectedValue={searchParams?.categoryid}
          categories={categories}
          onSelect={value => {
            if (value) handleTextChange("categoryid", value.id);
          }}
          isModal={Platform.OS !== "web"}
          showClearButton={true}
          onClear={() => clearField("categoryid")}
        />
      </View>
      <AccountSelecterDropdown
        label="Account"
        selectedValue={searchParams?.accountid}
        onSelect={(value: any) => {
          if (value) handleTextChange("accountid", value.id);
        }}
        isModal={Platform.OS !== "web"}
        accounts={accounts}
        groupBy="group"
        showClear={true}
        onClear={() => clearField("accountid")}
      />

      <MyTransactionTypesDropdown
        selectedValue={searchParams?.type}
        onSelect={value => {
          if (value) handleTextChange("type", value.value);
        }}
        isModal={Platform.OS !== "web"}
        isEdit={false}
        showClear={true}
        onClear={() => clearField("type")}
      />

      <View className="flex flex-row justify-center items-center gap-4 mt-4">
        <Button
          variant="destructive"
          size="md"
          haptic="medium"
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
          label="Apply"
          testID="btn-search-submit"
        />
      </View>
    </ScrollView>
  );

  return (
    <ResponsiveModal
      visible={isOpen}
      onClose={handleClose}
      title="Filter Transactions"
      size="lg"
      scrollable={false}
    >
      {content}
    </ResponsiveModal>
  );
}
