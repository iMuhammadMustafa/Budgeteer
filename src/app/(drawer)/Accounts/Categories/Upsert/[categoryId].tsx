import TextInputField from "@/src/components/TextInputField";
import { Account, TransactionTypes } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import * as accountService from "@/src/repositories/account.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text } from "react-native";
import "react-native-get-random-values";
import { v4 } from "uuid";
import { Button, ButtonText, ButtonSpinner, ButtonIcon, ButtonGroup } from "@/components/ui/button";
import Loading from "@/src/components/Loading";
import Icon from "@/src/lib/IonIcons";

export default function Create() {
  let { accountId } = useLocalSearchParams();
  const { session, isSessionLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useGetOneById<Account>("account", accountId as string, "accounts");
  const [formData, setFormData] = useState<Account>(data!);

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (values: Account) => {
      await upsertAccount({
        ...values,
        ...{
          updatedby: session?.user.id ?? "",
          updatedat: new Date(Date.now()).toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  if (error) return <Text>Error: {error.message}</Text>;

  if (isSessionLoading || isLoading || !data) return <Loading />;

  return (
    <SafeAreaView className="p-5">
      <ScrollView>
        <TextInputField
          label="Name"
          value={formData?.name ?? ""}
          onChange={name => setFormData({ ...formData, name })}
        />
        <TextInputField
          label="Category"
          value={formData?.category ?? ""}
          onChange={category => setFormData({ ...formData, category })}
        />
        <TextInputField
          label="Type"
          value={formData?.type ?? ""}
          onChange={type => setFormData({ ...formData, type })}
        />
        <TextInputField
          label="Currency"
          value={formData?.currency ?? ""}
          onChange={currency => setFormData({ ...formData, currency })}
        />
        <TextInputField
          label="Current Balance"
          value={formData?.currentbalance ?? "".toString()}
          onChange={currentbalance => setFormData({ ...formData, currentbalance })}
          keyboardType="numeric"
        />
        <TextInputField
          label="Open Balance"
          value={formData?.openbalance ?? "".toString()}
          onChange={openbalance => setFormData({ ...formData, openbalance })}
        />
        <TextInputField
          label="Notes"
          value={formData?.notes ?? ""}
          onChange={notes => setFormData({ ...formData, notes })}
        />
        <Button
          className="p-3 flex justify-center items-center"
          disabled={isLoading}
          onPress={() => mutation.mutate(formData)}
        >
          {isLoading ? <ButtonSpinner /> : <ButtonText className="font-medium text-sm ml-2">Save</ButtonText>}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
