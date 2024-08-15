import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { deleteAccount, fetchAllAccounts, useGetList } from "@/src/repositories/api";
import { router } from "expo-router";
import { Account } from "@/src/lib/supabase";

export default function Accounts() {
  const { data, isLoading, error } = useGetList<Account>("accounts");

  // const handleDelete = async (id: string) => {
  //   try {
  //     await deleteAccount(id);
  //     setAccounts(prevAccounts => prevAccounts.filter(account => account.Id !== id));
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const renderItem = (item: Account) => (
    <View>
      <Text className="text-foreground">{item.name}</Text>
    </View>
  );

  return <></>;
}
