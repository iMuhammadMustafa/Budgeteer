import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import List from "@/src/components/List";
import { Account } from "@/src/data/models/Models";
import { deleteAccount, fetchAllAccounts } from "@/src/repositories/api";
import { router } from "expo-router";
import { TableDemo } from "@/src/components/Table";

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await fetchAllAccounts();
        setAccounts(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      setAccounts(prevAccounts => prevAccounts.filter(account => account.Id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = (item: Account) => (
    <View>
      <Text className="text-foreground">{item.name}</Text>
    </View>
  );

  return (
    <>
      <TableDemo />
      {/* <Text>Accounts</Text>
      <TouchableOpacity
        onPress={() => {
          router.navigate("/Accounts/Create");
        }}
      >
        <Text>Create Account</Text>
      </TouchableOpacity>
      <List data={accounts} renderItem={renderItem} onDelete={handleDelete} /> */}
    </>
  );
}
