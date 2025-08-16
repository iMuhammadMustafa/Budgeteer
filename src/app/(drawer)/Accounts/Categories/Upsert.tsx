import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import AccountCategoryForm, { AccountCategoryFormType, initialState } from "@/src/components/forms/AccountCategoryForm";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountCategoryFormType>(initialState);

  const accountCategoryService = useAccountCategoryService();

  const { data, isLoading, error } = accountCategoryService.getAccountCategoryById(categoryId);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryId ? "Edit Account Category" : "Add Account Category",
    });
  }, []);

  useEffect(() => {
    if (categoryId && data) {
      setInitialValues({
        ...data,
      });
    }
  }, [categoryId, data]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <AccountCategoryForm category={initialValues} />;
}
