import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import AccountCategoryForm, { AccountCategoryFormType, initialState } from "@/src/components/forms/AccountCategoryForm";
import { useAccountCategoryService } from "@/src/services/AccountCategories.Service";

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<AccountCategoryFormType>(initialState);

  const accountCategoryService = useAccountCategoryService();

  const { data, isLoading, error } = accountCategoryService.findById(categoryId);

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
