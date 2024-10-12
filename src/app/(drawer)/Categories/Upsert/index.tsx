import CategoryForm, { CategoryFormType } from "@/src/components/pages/CategoryForm";
import { TableNames } from "@/src/consts/TableNames";
import { Inserts, Updates } from "@/src/lib/supabase";
import { useGetCategoryById } from "@/src/repositories/categories.service";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";

const initialState: Inserts<TableNames.Categories> | Updates<TableNames.Categories> = {
  name: "",
  group: "",
  type: "",
  description: "",
  icon: "CircleHelp",
  groupicon: "CircleHelp",
};

export default function Upsert() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const [initialValues, setInitialValues] = useState<CategoryFormType>(initialState);

  const { data: category, isLoading, error } = useGetCategoryById(categoryId);

  useEffect(() => {
    if (categoryId && category) {
      setInitialValues({
        ...category,
      });
    }
  }, [categoryId, category]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <CategoryForm category={initialValues} />;
}
