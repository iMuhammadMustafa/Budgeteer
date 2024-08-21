import Form from "@/src/components/Form";
import { Category } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { upsertCategory, useGetOneById } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import "react-native-get-random-values";
import * as uuid from "uuid";

export default function Create() {
  let { categoryId } = useLocalSearchParams();

  const { session } = useAuth();
  const queryClient = useQueryClient();

  let initialValues: Category = {
    id: uuid.v4(),
    name: "",
    description: "",
    type: "",
    createdat: new Date(Date.now()).toISOString(),
    updatedat: new Date(Date.now()).toISOString(),
    createdby: session?.user.id ?? "",
    updatedby: null,
    isdeleted: false,
    tenantid: session?.user.id ?? "",
  };

  if (categoryId && categoryId != "null" && categoryId != "new") {
    const { data } = useGetOneById<Category>("category", categoryId as string, "categories");
    if (data) initialValues = { ...initialValues, ...data };
  }

  console.log(session?.user);

  const mutation = useMutation({
    mutationFn: upsertCategory,
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["category", "categories"] });
    },
  });

  const fields = {
    name: { label: "Name" },
    type: { label: "Type" },
    description: { label: "Description" },
  };

  return (
    <>
      {mutation.isPending && <Text>Adding...</Text>}
      {mutation.isError && <Text>Error {JSON.stringify(mutation.error)}</Text>}

      <Form initialValues={initialValues} onSubmit={values => mutation.mutate(values)} fields={fields} />
    </>
  );
}
