import Form from "@/src/components/Form";
import TextInputField from "@/src/components/TextInputField";
import Icon from "@/src/lib/IonIcons";
import { Category } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { upsertCategory, useGetOneById } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import "react-native-get-random-values";
import * as uuid from "uuid";
import { icons } from "lucide-react-native";

export default function Create() {
  let { categoryId } = useLocalSearchParams();
  const iconNames = Object.keys(icons);

  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <Text>Loading...</Text>;

  const queryClient = useQueryClient();

  const [filteredIcons, setFilterdIcons] = useState(iconNames);

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
    icon: null,
  };

  if (categoryId && categoryId != "null" && categoryId != "new") {
    const { data, isLoading } = useGetOneById<Category>("category", categoryId as string, "categories");
    if (data) initialValues = { ...initialValues, ...data };
  }
  const [icon, setIcon] = useState(initialValues.icon);

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

      <Form
        initialValues={initialValues}
        onSubmit={values => {
          // console.log(values);
          mutation.mutate({ ...values, icon });
        }}
        fields={fields}
      >
        <TextInputField
          label="Icon"
          value={icon}
          onChange={text => {
            setIcon(text);
            setFilterdIcons(iconNames.filter(i => i.toLowerCase().includes(text.toLowerCase())));
          }}
          keyboardType="default"
        />
        <FlatList
          data={filteredIcons}
          contentContainerClassName="p-5 gap-5"
          horizontal
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setIcon(item);
                setFilterdIcons(iconNames.filter(i => i === item));
              }}
            >
              <View className="flex justify-center items-center">
                <Icon name={item} size={20} /> <Text>{item}</Text>
              </View>
            </Pressable>
          )}
        />
      </Form>
    </>
  );
}
