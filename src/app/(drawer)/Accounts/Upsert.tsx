import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import AccountForm, { AccountFormType, initialState } from "@/src/components/forms/AccountForm";
import { useAccountService } from "@/src/services/Accounts.Service";

export default function Upsert() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountFormType>(initialState);

  const accountService = useAccountService();
  const { data, isLoading, error } = accountService.findById(accountId);

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
        running_balance: data.running_balance,
      });
    }
  }, [accountId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <AccountForm account={initialValues} />;
}
