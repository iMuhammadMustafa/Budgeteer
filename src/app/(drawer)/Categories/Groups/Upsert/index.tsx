import AccountCategoryForm, { AccountCategoryFormType } from "@/src/components/pages/AccountCategoryForm";
import CategoryGroupForm, { CategoryGroupFormType } from "@/src/components/pages/CategoryGroupForm";
import { TableNames } from "@/src/consts/TableNames";
import { Inserts, Updates } from "@/src/lib/supabase";
import { useGetCategoryGroupById } from "@/src/repositories/categorygroups.service";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useState, useEffect, useLayoutEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialAccountState: Inserts<TableNames.CategoryGroups> | Updates<TableNames.CategoryGroups> = {
  id: "",
  name: "",
  description: "",
  icon: "",
  iconcolor: "",
};

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<CategoryGroupFormType>(initialAccountState);

  const navigation = useNavigation();

  const { data, isLoading, error } = useGetCategoryGroupById(categoryId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: categoryId ? "Edit Category" : "Add Category",
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

  return <CategoryGroupForm category={initialValues} />;
}
