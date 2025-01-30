import AccountForm, { AccountFormType } from "@/src/components/pages/AccountForm";
import { TableNames } from "@/src/consts/TableNames";
import { Inserts, Updates } from "@/src/lib/supabase";
import { useGetAccountById } from "@/src/repositories/services/account.service";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useState, useEffect, useLayoutEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialAccountState: Inserts<TableNames.Accounts> | Updates<TableNames.Accounts> = {
  name: "",
  categoryid: "",
  balance: 0,
  currency: "USD",
  notes: "",
};

export default function Upsert() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountFormType>(initialAccountState);

  const { data, isLoading, error } = useGetAccountById(accountId);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: accountId ? "Edit Account" : "Add Account",
    });
  }, []);

  useEffect(() => {
    if (accountId && data) {
      setInitialValues({
        ...data,
      });
    }
  }, [accountId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <AccountForm account={initialValues} />;
}
