// components/AccountForm.tsx
import Form from "@/src/components/Form";
import { Account } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { upsertAccount, useGetOneById } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text } from "react-native";
import "react-native-get-random-values";
// import { v4 as uuidv4 } from "uuid";
import * as uuid from "uuid";

export default function Create() {
  let { accountId } = useLocalSearchParams();

  const { session } = useAuth();
  const queryClient = useQueryClient();

  let initialValues: Account = {
    id: uuid.v4(),
    name: "",
    category: "",
    type: "",
    openbalance: 0,
    currentbalance: 0,
    currency: "USD",
    notes: "",
    createdat: new Date(Date.now()).toISOString(),
    updatedat: new Date(Date.now()).toISOString(),
    createdby: session?.user.id ?? "",
    updatedby: null,
    isdeleted: false,
    tenantid: session?.user.id ?? "",
  };

  if (accountId && accountId != "null" && accountId != "new") {
    const { data } = useGetOneById<Account>("account", accountId as string, "accounts");
    if (data) initialValues = { ...initialValues, ...data };
  }

  const mutation = useMutation({
    mutationFn: upsertAccount,
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["account", "accounts"] });
    },
  });

  const fields = {
    name: { label: "Name" },
    category: { label: "Category" },
    type: { label: "Type" },
    openbalance: { label: "Open Balance", type: "number" },
    currency: { label: "Currency" },
    notes: { label: "Notes" },
  };

  return (
    <>
      {mutation.isPending && <Text>Adding...</Text>}
      {mutation.isError && <Text>Adding...</Text>}

      <Form initialValues={initialValues} onSubmit={values => mutation.mutate(values)} fields={fields} />
    </>
  );
}
