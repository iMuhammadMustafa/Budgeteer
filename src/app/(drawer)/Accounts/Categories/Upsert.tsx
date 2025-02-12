import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useGetAccountCategoryById } from "@/src/services/repositories/AccountCategories.Repository";
import AccountCategoryForm, { AccountCategoryFormType, initialState } from "@/src/components/forms/AccountCategoryForm";

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountCategoryFormType>(initialState);

  const { data, isLoading, error } = useGetAccountCategoryById(categoryId);

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
