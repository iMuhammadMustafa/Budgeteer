// components/AccountForm.tsx
import Form from "@/src/components/Form";
import { Account, supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { createAccount, updateAccount, useGetList, useGetOneById } from "@/src/repositories/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Text } from "react-native";
import { v4 as uuidv4 } from "uuid";

export default function Create() {
  const { accountId } = useGlobalSearchParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  let initialValues: Account = {
    id: uuidv4(),
    name: "",
    category: "",
    type: "",
    openbalance: 0,
    currentbalance: 0,
    currency: "USD",
    notes: "",
    createdat: new Date(Date.now()),
    updatedat: new Date(Date.now()),
    createdby: session?.user.id,
    updatedby: null,
    isdeleted: false,
    tenantid: session?.user.id,
  };

  const mutation = useMutation({
    mutationFn: async (account: Account) => {
      const { data, error } = await supabase
        .from("accounts")
        .upsert({ ...account })
        .select();
    },
    onSuccess: d => {
      queryClient.invalidateQueries({ queryKey: ["account", "accounts"] });
    },
  });

  if (accountId && accountId != "null") {
    const { data } = useGetOneById<Account>("account", accountId as string, "accounts");
    if (data) initialValues = { ...initialValues, ...data };

    console.log(data);
  }

  const handleSubmit = async (values: Account) => {
    mutation.mutate(values);
  };

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

      <Form initialValues={initialValues} onSubmit={handleSubmit} fields={fields} />
    </>
  );
}
